"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Music2, RefreshCw, FileText, Download } from "lucide-react";

type RecordingItem = {
  name: string;
  size: number;
  modifiedAt: string;
  hasSummary: boolean;
  hasTranscript: boolean;
};

type RecordingsResponse = {
  exportFolder: string;
  recordings: RecordingItem[];
};

function bytesToSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RecordingsBrowser() {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"summary" | "transcript">("summary");
  const [exportFolder, setExportFolder] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => recordings.find((item) => item.name === selected) ?? null,
    [recordings, selected],
  );

  const fetchRecordings = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch("/api/recordings");
      const data = (await res.json()) as RecordingsResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to load recordings");
      }

      setRecordings(data.recordings);
      setExportFolder(data.exportFolder);
      setError(null);
      if (!selected && data.recordings.length > 0) {
        setSelected(data.recordings[0].name);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load recordings";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selected]);

  useEffect(() => {
    void fetchRecordings();
  }, [fetchRecordings]);

  useEffect(() => {
    const loadIntelligence = async () => {
      if (!selectedItem) {
        setSummary(null);
        setTranscript(null);
        return;
      }

      const baseName = selectedItem.name.replace(/\.m4a$/i, "");
      
      // Load Summary
      if (selectedItem.hasSummary) {
        try {
          // Try tailored _summary.md first
          let res = await fetch(`/api/recordings/${encodeURIComponent(`${baseName}_summary.md`)}`);
          if (!res.ok) {
            // Fallback to legacy .md
            res = await fetch(`/api/recordings/${encodeURIComponent(`${baseName}.md`)}`);
          }
          if (res.ok) setSummary(await res.text());
        } catch {
          setSummary(null);
        }
      } else {
        setSummary(null);
      }

      // Load Transcript
      if (selectedItem.hasTranscript) {
        try {
          const res = await fetch(`/api/recordings/${encodeURIComponent(`${baseName}_transcript.md`)}`);
          if (res.ok) setTranscript(await res.text());
        } catch {
          setTranscript(null);
        }
      } else {
        setTranscript(null);
      }
    };

    void loadIntelligence();
  }, [selectedItem]);

  // Default to summary if transcript selected but not available
  useEffect(() => {
    if (viewMode === "transcript" && !transcript && summary) {
      setViewMode("summary");
    }
  }, [viewMode, transcript, summary]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading recordings...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1 bg-zinc-950 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm text-zinc-300">Recordings</CardTitle>
            <Button
              size="sm"
              variant="outline"
              disabled={refreshing}
              onClick={() => fetchRecordings(true)}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-zinc-500 break-all">{exportFolder || "No export folder configured"}</p>
        </CardHeader>
        <CardContent className="pt-0">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!error && recordings.length === 0 && (
            <p className="text-sm text-zinc-500">No recordings found.</p>
          )}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {recordings.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setSelected(item.name)}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  selected === item.name
                    ? "border-emerald-500 bg-emerald-900/20"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-zinc-100">{item.name}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(item.modifiedAt).toLocaleString()} · {bytesToSize(item.size)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {item.hasSummary && <FileText className="h-4 w-4 text-emerald-400" />}
                    {item.hasTranscript && <RefreshCw className="h-4 w-4 text-blue-400" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 bg-zinc-950 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-zinc-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music2 className="h-4 w-4" />
              <span>Playback</span>
            </div>
            {selectedItem && (summary || transcript) && (
              <div className="flex bg-zinc-900 rounded-md p-1 gap-1">
                {summary && (
                  <button
                    onClick={() => setViewMode("summary")}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      viewMode === "summary" ? "bg-zinc-800 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Summary
                  </button>
                )}
                {transcript && (
                  <button
                    onClick={() => setViewMode("transcript")}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      viewMode === "transcript" ? "bg-zinc-800 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Transcript
                  </button>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {!selectedItem && <p className="text-sm text-zinc-500">Select a recording to play.</p>}
          {selectedItem && (
            <>
              <p className="text-sm text-zinc-300 font-mono text-emerald-500">{selectedItem.name}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="h-8">
                  <a
                    href={`/api/recordings/${encodeURIComponent(selectedItem.name)}`}
                    download={selectedItem.name}
                  >
                    <Download className="h-4 w-4" />
                    Audio
                  </a>
                </Button>
                {selectedItem.hasSummary && (
                   <Button asChild size="sm" variant="outline" className="h-8">
                    <a
                      href={`/api/recordings/${encodeURIComponent(
                        selectedItem.hasTranscript ? `${selectedItem.name.replace(/\.m4a$/i, "")}_transcript.md` : `${selectedItem.name.replace(/\.m4a$/i, "")}.md`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText className="h-4 w-4" />
                      Raw Intelligence
                    </a>
                  </Button>
                )}
              </div>
              <audio
                controls
                className="w-full h-10 filter invert brightness-125"
                src={`/api/recordings/${encodeURIComponent(selectedItem.name)}`}
              />
              {viewMode === "summary" && summary && (
                <div className="rounded-md border border-emerald-900/30 bg-zinc-900/50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-3">Strategic Intelligence Summary</p>
                  <div className="prose prose-invert prose-xs max-w-none">
                    <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-zinc-300 font-sans">{summary}</pre>
                  </div>
                </div>
              )}
              {viewMode === "transcript" && transcript && (
                <div className="rounded-md border border-blue-900/30 bg-zinc-900/50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-3">Verbatim Transcript</p>
                  <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-zinc-400 font-sans">{transcript}</pre>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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
    const loadSummary = async () => {
      if (!selectedItem || !selectedItem.hasSummary) {
        setSummary(null);
        return;
      }

      const summaryName = `${selectedItem.name.replace(/\.m4a$/i, "")}.md`;
      try {
        const res = await fetch(`/api/recordings/${encodeURIComponent(summaryName)}`);
        if (!res.ok) {
          throw new Error();
        }
        setSummary(await res.text());
      } catch {
        setSummary(null);
      }
    };

    void loadSummary();
  }, [selectedItem]);

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
                  {item.hasSummary && <FileText className="h-4 w-4 text-zinc-400" />}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 bg-zinc-950 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
            <Music2 className="h-4 w-4" />
            Playback
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {!selectedItem && <p className="text-sm text-zinc-500">Select a recording to play.</p>}
          {selectedItem && (
            <>
              <p className="text-sm text-zinc-300">{selectedItem.name}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <a
                    href={`/api/recordings/${encodeURIComponent(selectedItem.name)}`}
                    download={selectedItem.name}
                  >
                    <Download className="h-4 w-4" />
                    Download audio
                  </a>
                </Button>
                {selectedItem.hasSummary && (
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={`/api/recordings/${encodeURIComponent(
                        `${selectedItem.name.replace(/\.m4a$/i, "")}.md`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText className="h-4 w-4" />
                      Open summary
                    </a>
                  </Button>
                )}
              </div>
              <audio
                controls
                className="w-full"
                src={`/api/recordings/${encodeURIComponent(selectedItem.name)}`}
              />
              {summary && (
                <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Summary</p>
                  <pre className="whitespace-pre-wrap break-words text-xs text-zinc-300">{summary}</pre>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

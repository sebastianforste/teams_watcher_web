"use client";

import { useState, useEffect, useCallback } from "react";
import { StatusHero } from "@/components/StatusHero";
import { LogViewer } from "@/components/LogViewer";
import { ConfigEditor } from "@/components/ConfigEditor";
import { RecordingsBrowser } from "@/components/RecordingsBrowser";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  RotateCcw,
  Sun,
  Moon,
  Play,
  Square,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type WatcherStatus = {
  state?: string;
  meeting?: string;
  timestamp?: string;
  [key: string]: string | undefined;
};

type StatusApiResponse = {
  status: WatcherStatus;
  logs: string[];
  meta?: {
    lines: number;
    bytes: number;
  };
};

const LIVE_STATUS_RECONNECT_LIMIT = 3;
const STATUS_POLL_INTERVAL_MS = 3000;

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [status, setStatus] = useState<WatcherStatus>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [controlPending, setControlPending] = useState<"start" | "restart" | "stop" | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logLines, setLogLines] = useState(50);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
  };

  const applySnapshot = useCallback((snapshot: StatusApiResponse) => {
    setStatus(snapshot.status);
    setLogs(snapshot.logs);
    setStatusError(null);
  }, []);

  const fetchStatus = useCallback(async (manual = false) => {
    if (manual) {
      setIsRefreshing(true);
    }

    try {
      const res = await fetch(`/api/status?lines=${logLines}`);
      const json = (await res.json()) as StatusApiResponse;
      if (!res.ok) {
        throw new Error("Failed to fetch watcher status");
      }
      applySnapshot(json);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch watcher status";
      setStatusError(message);
    } finally {
      if (manual) {
        setIsRefreshing(false);
      }
    }
  }, [applySnapshot, logLines]);

  useEffect(() => {
    const storage =
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined" &&
      typeof window.localStorage.getItem === "function"
        ? window.localStorage
        : null;
    const savedTheme = storage ? storage.getItem("teams-recorder-theme") : null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      return;
    }

    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      setTheme(prefersLight ? "light" : "dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined" &&
      typeof window.localStorage.setItem === "function"
    ) {
      window.localStorage.setItem("teams-recorder-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    let pollingEnabled = false;
    let reconnectCount = 0;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let stream: EventSource | null = null;

    const clearPollTimer = () => {
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
    };

    const startPollingFallback = () => {
      if (!isMounted || pollingEnabled) {
        return;
      }

      pollingEnabled = true;
      const poll = async () => {
        await fetchStatus();
        if (isMounted && pollingEnabled) {
          pollTimer = setTimeout(poll, STATUS_POLL_INTERVAL_MS);
        }
      };
      void poll();
    };

    const startStream = () => {
      if (typeof window === "undefined" || typeof window.EventSource !== "function") {
        startPollingFallback();
        return;
      }

      stream = new window.EventSource(`/api/status/stream?lines=${logLines}`);
      stream.addEventListener("snapshot", (event: Event) => {
        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as StatusApiResponse;
          applySnapshot(payload);
          reconnectCount = 0;
        } catch {
          setStatusError("Received invalid live update payload");
        }
      });

      stream.addEventListener("error", () => {
        reconnectCount += 1;
        if (reconnectCount >= LIVE_STATUS_RECONNECT_LIMIT) {
          stream?.close();
          stream = null;
          setStatusError("Live updates unavailable. Falling back to polling.");
          startPollingFallback();
        }
      });
    };

    void fetchStatus();
    startStream();

    return () => {
      isMounted = false;
      pollingEnabled = false;
      clearPollTimer();
      stream?.close();
      stream = null;
    };
  }, [applySnapshot, fetchStatus, logLines]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeoutId);
  }, [toast]);

  const handleControl = async (action: "start" | "restart" | "stop") => {
    setControlPending(action);
    try {
      const res = await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Control action failed");
      }

      showToast("success", data.message || `Service ${action}ed`);
      await fetchStatus(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Control action failed";
      showToast("error", message);
    } finally {
      setControlPending(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Teams Watcher
                </h1>
                <p className="text-zinc-500">Automated Recording & Monitoring</p>
            </div>
            <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Toggle theme"
                  title="Toggle theme"
                  onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Refresh status"
                  title="Refresh status"
                  disabled={isRefreshing}
                  onClick={() => fetchStatus(true)}
                >
                    {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
            </div>
        </div>

        {statusError && (
          <div className="bg-red-950/60 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{statusError}</span>
          </div>
        )}

        {/* Top Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <StatusHero 
                    status={status.state ?? "unknown"} 
                    meetingTitle={status.meeting} 
                />
            </div>
            <div className="grid grid-rows-2 gap-4">
                 <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center gap-4">
                    <h3 className="text-zinc-400 text-sm font-medium">Service Control</h3>
                    <div className="flex gap-2">
                        <Button 
                            disabled={controlPending !== null}
                            aria-label="Start service"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
                            onClick={() => handleControl('start')}
                        >
                            {controlPending === "start" ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            Start
                        </Button>
                        <Button
                            disabled={controlPending !== null}
                            aria-label="Restart service"
                            className="flex-1 bg-amber-600 hover:bg-amber-700"
                            onClick={() => handleControl('restart')}
                        >
                            {controlPending === "restart" ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4 mr-2" />
                            )}
                            Restart
                        </Button>
                        <Button 
                            disabled={controlPending !== null}
                            aria-label="Stop service"
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            onClick={() => handleControl('stop')}
                        >
                            {controlPending === "stop" ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Square className="h-4 w-4 mr-2" />
                            )}
                            Stop
                        </Button>
                    </div>
                    {controlPending && (
                      <p className="text-xs text-zinc-500">Applying `{controlPending}`...</p>
                    )}
                 </div>
                 <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Last Update</span>
                        <span className="font-mono text-sm">{status.timestamp || "Never"}</span>
                    </div>
                 </div>
            </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="logs" className="w-full">
            <div className="flex items-center justify-between gap-4">
              <TabsList className="bg-zinc-900 border border-zinc-800">
                  <TabsTrigger value="logs">System Logs</TabsTrigger>
                  <TabsTrigger value="recordings">Recordings</TabsTrigger>
                  <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Tail lines</span>
                {[50, 100, 200].map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={value === logLines ? "default" : "outline"}
                    className="h-7 px-2"
                    onClick={() => setLogLines(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
            <TabsContent value="logs" className="mt-4">
                <LogViewer logs={logs} />
            </TabsContent>
            <TabsContent value="recordings" className="mt-4">
                <RecordingsBrowser />
            </TabsContent>
            <TabsContent value="config" className="mt-4">
                <ConfigEditor />
            </TabsContent>
        </Tabs>

      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 max-w-sm z-50">
          <div
            role="status"
            aria-live="polite"
            className={`rounded-lg border px-4 py-3 text-sm shadow-xl flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-700 text-emerald-200"
                : "bg-red-950/90 border-red-700 text-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

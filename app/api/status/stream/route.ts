import { watch } from "fs";
import path from "path";
import {
  getSnapshotOptions,
  readWatcherSnapshot,
  WATCHER_LOG_FILE,
  WATCHER_STATUS_FILE,
} from "@/lib/status-snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isInterestingFileChange(filename: string | null, watchedFile: string): boolean {
  if (!filename) {
    return true;
  }
  return filename === path.basename(watchedFile);
}

export async function GET(req: Request) {
  const options = getSnapshotOptions(req);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let isClosed = false;
      let debounceTimer: NodeJS.Timeout | null = null;
      let heartbeatTimer: NodeJS.Timeout | null = null;
      const watchers: Array<ReturnType<typeof watch>> = [];

      const send = (event: string, payload: unknown) => {
        if (isClosed) {
          return;
        }
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      const sendSnapshot = async () => {
        try {
          const snapshot = await readWatcherSnapshot(options);
          send("snapshot", snapshot);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to read watcher snapshot";
          send("error", { message });
        }
      };

      const scheduleSnapshot = () => {
        if (isClosed || debounceTimer) {
          return;
        }

        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          void sendSnapshot();
        }, 200);
      };

      const watchPath = (filePath: string) => {
        try {
          const watcher = watch(path.dirname(filePath), (_eventType, filename) => {
            if (isInterestingFileChange(filename, filePath)) {
              scheduleSnapshot();
            }
          });
          watchers.push(watcher);
        } catch {
          // Ignore missing directories or unsupported watcher errors.
        }
      };

      const cleanup = () => {
        if (isClosed) {
          return;
        }
        isClosed = true;

        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        watchers.forEach((watcher) => watcher.close());
        watchers.length = 0;

        try {
          controller.close();
        } catch {
          // Ignore close errors after abort.
        }
      };

      watchPath(WATCHER_STATUS_FILE);
      watchPath(WATCHER_LOG_FILE);

      heartbeatTimer = setInterval(() => {
        if (!isClosed) {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        }
      }, 15_000);

      void sendSnapshot();
      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

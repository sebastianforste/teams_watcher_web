import { open, readFile } from "fs/promises";
import os from "os";
import path from "path";

export const WATCHER_STATUS_FILE = path.join(os.homedir(), ".teams_watcher_status");
export const WATCHER_LOG_FILE = path.join(os.homedir(), "Library/Logs/TeamsVoiceMemos.log");

export const DEFAULT_MAX_LOG_LINES = 50;
export const DEFAULT_MAX_LOG_BYTES = 64 * 1024;
export const MAX_LOG_LINES_LIMIT = 500;
export const MAX_LOG_BYTES_LIMIT = 1024 * 1024;

export type WatcherStatusData = Record<string, string>;

export type WatcherSnapshot = {
  status: WatcherStatusData;
  logs: string[];
  meta: {
    lines: number;
    bytes: number;
  };
};

export type SnapshotOptions = {
  maxLines: number;
  maxBytes: number;
};

function parseStatusContent(rawStatus: string): WatcherStatusData {
  const statusData: WatcherStatusData = { state: "unknown" };

  rawStatus.split("\n").forEach((line) => {
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key) {
      return;
    }
    statusData[key] = value;
  });

  return statusData;
}

function parseBoundedInt(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

async function readLogTail(logFile: string, maxLines: number, maxBytes: number): Promise<string[]> {
  const handle = await open(logFile, "r");

  try {
    const { size } = await handle.stat();
    if (size === 0) {
      return [];
    }

    const bytesToRead = Math.min(size, maxBytes);
    const start = size - bytesToRead;
    const buffer = Buffer.alloc(bytesToRead);
    const { bytesRead } = await handle.read(buffer, 0, bytesToRead, start);

    let chunk = buffer.toString("utf-8", 0, bytesRead);
    if (start > 0) {
      const firstNewline = chunk.indexOf("\n");
      if (firstNewline !== -1) {
        chunk = chunk.slice(firstNewline + 1);
      }
    }

    return chunk.split("\n").filter(Boolean).slice(-maxLines);
  } finally {
    await handle.close();
  }
}

export function getSnapshotOptions(req?: Request): SnapshotOptions {
  const requestUrl = req ? new URL(req.url) : null;
  return {
    maxLines: parseBoundedInt(
      requestUrl?.searchParams.get("lines") ?? null,
      DEFAULT_MAX_LOG_LINES,
      10,
      MAX_LOG_LINES_LIMIT,
    ),
    maxBytes: parseBoundedInt(
      requestUrl?.searchParams.get("bytes") ?? null,
      DEFAULT_MAX_LOG_BYTES,
      8 * 1024,
      MAX_LOG_BYTES_LIMIT,
    ),
  };
}

export async function readWatcherSnapshot(options: SnapshotOptions): Promise<WatcherSnapshot> {
  const statusData: WatcherStatusData = { state: "unknown" };
  let logs: string[] = [];

  try {
    const rawStatus = await readFile(WATCHER_STATUS_FILE, "utf-8");
    Object.assign(statusData, parseStatusContent(rawStatus));
  } catch {
    // Status file might not exist if script never ran.
  }

  try {
    logs = await readLogTail(WATCHER_LOG_FILE, options.maxLines, options.maxBytes);
  } catch {
    // Log file might not exist.
  }

  return {
    status: statusData,
    logs,
    meta: {
      lines: options.maxLines,
      bytes: options.maxBytes,
    },
  };
}

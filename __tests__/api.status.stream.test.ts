// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

type WatchListener = (eventType: string, filename: string | null) => void;

const watchMock = vi.fn();
const getSnapshotOptionsMock = vi.fn();
const readWatcherSnapshotMock = vi.fn();

vi.mock("fs", () => ({
  watch: watchMock,
}));

vi.mock("@/lib/status-snapshot", () => ({
  WATCHER_STATUS_FILE: "/tmp/mock/.teams_watcher_status",
  WATCHER_LOG_FILE: "/tmp/mock/TeamsVoiceMemos.log",
  getSnapshotOptions: getSnapshotOptionsMock,
  readWatcherSnapshot: readWatcherSnapshotMock,
}));

type WatchRegistration = {
  directory: string;
  listener: WatchListener;
  close: ReturnType<typeof vi.fn>;
};

const watchRegistrations: WatchRegistration[] = [];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs = 1_500,
): Promise<string> {
  const result = await Promise.race([
    reader.read(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out waiting for stream chunk (${timeoutMs}ms)`)), timeoutMs),
    ),
  ]);

  if (result.done) {
    throw new Error("Stream closed before next chunk");
  }

  return new TextDecoder().decode(result.value);
}

describe("/api/status/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    watchRegistrations.length = 0;

    getSnapshotOptionsMock.mockReturnValue({ maxLines: 50, maxBytes: 64 * 1024 });
    watchMock.mockImplementation((directory: string, listener: WatchListener) => {
      const close = vi.fn();
      watchRegistrations.push({ directory, listener, close });
      return { close };
    });
  });

  it("returns SSE headers, emits an initial snapshot, and closes watchers on abort", async () => {
    readWatcherSnapshotMock.mockResolvedValue({
      status: { state: "idle" },
      logs: ["watcher running"],
      meta: { lines: 50, bytes: 64 * 1024 },
    });

    const { GET } = await import("@/app/api/status/stream/route");
    const abortController = new AbortController();
    const req = new Request("http://localhost:3000/api/status/stream?lines=50", {
      signal: abortController.signal,
    });
    const res = await GET(req);

    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(res.headers.get("cache-control")).toBe("no-cache, no-transform");
    expect(res.headers.get("connection")).toBe("keep-alive");
    expect(res.headers.get("x-accel-buffering")).toBe("no");
    expect(getSnapshotOptionsMock).toHaveBeenCalledWith(req);
    expect(watchRegistrations).toHaveLength(2);

    const reader = res.body?.getReader();
    expect(reader).toBeTruthy();
    const firstChunk = await readChunk(reader!);
    expect(firstChunk).toContain("event: snapshot");
    expect(firstChunk).toContain('"state":"idle"');

    abortController.abort();
    await wait(0);
    expect(watchRegistrations.every((entry) => entry.close.mock.calls.length === 1)).toBe(true);
  });

  it("emits a new snapshot when a watched file changes", async () => {
    readWatcherSnapshotMock
      .mockResolvedValueOnce({
        status: { state: "idle" },
        logs: ["boot"],
        meta: { lines: 50, bytes: 64 * 1024 },
      })
      .mockResolvedValueOnce({
        status: { state: "recording", meeting: "Standup" },
        logs: ["recording started"],
        meta: { lines: 50, bytes: 64 * 1024 },
      });

    const { GET } = await import("@/app/api/status/stream/route");
    const abortController = new AbortController();
    const res = await GET(
      new Request("http://localhost:3000/api/status/stream", {
        signal: abortController.signal,
      }),
    );
    const reader = res.body?.getReader();
    expect(reader).toBeTruthy();

    await readChunk(reader!);
    expect(watchRegistrations).toHaveLength(2);
    watchRegistrations[0].listener("change", ".teams_watcher_status");

    await wait(260);
    const secondChunk = await readChunk(reader!);
    expect(secondChunk).toContain("event: snapshot");
    expect(secondChunk).toContain('"state":"recording"');
    expect(readWatcherSnapshotMock).toHaveBeenCalledTimes(2);

    abortController.abort();
  });

  it("emits stream error events when snapshot reads fail", async () => {
    readWatcherSnapshotMock.mockRejectedValue(new Error("boom"));

    const { GET } = await import("@/app/api/status/stream/route");
    const abortController = new AbortController();
    const res = await GET(
      new Request("http://localhost:3000/api/status/stream", {
        signal: abortController.signal,
      }),
    );
    const reader = res.body?.getReader();
    expect(reader).toBeTruthy();

    const firstChunk = await readChunk(reader!);
    expect(firstChunk).toContain("event: error");
    expect(firstChunk).toContain("boom");

    abortController.abort();
  });

  it("ignores unrelated file change events", async () => {
    readWatcherSnapshotMock.mockResolvedValue({
      status: { state: "idle" },
      logs: ["boot"],
      meta: { lines: 50, bytes: 64 * 1024 },
    });

    const { GET } = await import("@/app/api/status/stream/route");
    const abortController = new AbortController();
    const res = await GET(
      new Request("http://localhost:3000/api/status/stream", {
        signal: abortController.signal,
      }),
    );
    const reader = res.body?.getReader();
    expect(reader).toBeTruthy();

    await readChunk(reader!);
    expect(readWatcherSnapshotMock).toHaveBeenCalledTimes(1);
    expect(watchRegistrations).toHaveLength(2);

    watchRegistrations[0].listener("change", "some-other-file.txt");
    watchRegistrations[1].listener("change", "another-unrelated.log");

    await wait(260);
    expect(readWatcherSnapshotMock).toHaveBeenCalledTimes(1);

    abortController.abort();
  });
});

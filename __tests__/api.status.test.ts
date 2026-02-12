// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const readFileMock = vi.fn();
const openMock = vi.fn();

vi.mock("fs/promises", () => ({
  readFile: readFileMock,
  open: openMock,
}));

function createMockFileHandle(content: string) {
  const bytes = Buffer.from(content, "utf-8");

  return {
    stat: vi.fn().mockResolvedValue({ size: bytes.length }),
    read: vi.fn().mockImplementation(async (buffer: Buffer, offset: number, length: number, position: number) => {
      const copied = bytes.copy(buffer, offset, position, position + length);
      return { bytesRead: copied, buffer };
    }),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

describe("/api/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("parses status values with '=' characters and returns log tail", async () => {
    readFileMock.mockResolvedValue(
      "timestamp=2026-02-11 10:00:00\nstate=recording\nmeeting=Budget=Q1\n",
    );
    const logHandle = createMockFileHandle("line-1\nline-2\nline-3\n");
    openMock.mockResolvedValue(logHandle);

    const { GET } = await import("@/app/api/status/route");
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status.meeting).toBe("Budget=Q1");
    expect(json.logs).toEqual(["line-1", "line-2", "line-3"]);
    expect(logHandle.close).toHaveBeenCalledTimes(1);
  });

  it("reads only bounded bytes from large logs", async () => {
    readFileMock.mockResolvedValue("state=idle\n");
    const largePrefix = "x".repeat(70_000);
    const logHandle = createMockFileHandle(`${largePrefix}\nrecent-1\nrecent-2\n`);
    openMock.mockResolvedValue(logHandle);

    const { GET } = await import("@/app/api/status/route");
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(logHandle.read).toHaveBeenCalledTimes(1);
    expect(logHandle.read.mock.calls[0][2]).toBe(64 * 1024);
    expect(json.logs).toContain("recent-1");
    expect(json.logs).toContain("recent-2");
  });

  it("honors bounded query params for tail size", async () => {
    readFileMock.mockResolvedValue("state=idle\n");
    const logHandle = createMockFileHandle("a\nb\nc\n");
    openMock.mockResolvedValue(logHandle);

    const { GET } = await import("@/app/api/status/route");
    const res = await GET(new Request("http://localhost:3000/api/status?lines=200&bytes=8192"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(logHandle.read.mock.calls[0][2]).toBe(Buffer.byteLength("a\nb\nc\n"));
    expect(json.meta).toEqual({ lines: 200, bytes: 8192 });
  });

  it("falls back to unknown state when files are missing", async () => {
    readFileMock.mockRejectedValue(new Error("missing"));
    openMock.mockRejectedValue(new Error("missing"));

    const { GET } = await import("@/app/api/status/route");
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status.state).toBe("unknown");
    expect(json.logs).toEqual([]);
  });
});

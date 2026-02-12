// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const execFileMock = vi.fn();

vi.mock("child_process", () => ({
  execFile: execFileMock,
}));

function trustedHeaders() {
  return {
    "content-type": "application/json",
    host: "localhost:3000",
    origin: "http://localhost:3000",
  };
}

describe("/api/control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    execFileMock.mockImplementation((_cmd: string, _args: string[], cb: (error: Error | null) => void) => {
      cb(null);
    });
  });

  it("starts service via launchctl unload+load", async () => {
    const { POST } = await import("@/app/api/control/route");

    const res = await POST(
      new Request("http://localhost:3000/api/control", {
        method: "POST",
        headers: trustedHeaders(),
        body: JSON.stringify({ action: "start" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(execFileMock).toHaveBeenCalledTimes(2);
    expect(execFileMock.mock.calls[0][0]).toBe("/bin/launchctl");
    expect(execFileMock.mock.calls[0][1][0]).toBe("unload");
    expect(execFileMock.mock.calls[1][1][0]).toBe("load");
  });

  it("rejects invalid actions", async () => {
    const { POST } = await import("@/app/api/control/route");

    const res = await POST(
      new Request("http://localhost:3000/api/control", {
        method: "POST",
        headers: trustedHeaders(),
        body: JSON.stringify({ action: "pause" }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(execFileMock).not.toHaveBeenCalled();
  });

  it("rejects non-local origins", async () => {
    const { POST } = await import("@/app/api/control/route");

    const res = await POST(
      new Request("http://localhost:3000/api/control", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          host: "localhost:3000",
          origin: "https://example.com",
        },
        body: JSON.stringify({ action: "stop" }),
      }),
    );

    expect(res.status).toBe(403);
    expect(execFileMock).not.toHaveBeenCalled();
  });
});

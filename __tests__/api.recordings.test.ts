// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const readFileMock = vi.fn();
const readdirMock = vi.fn();
const statMock = vi.fn();

vi.mock("fs/promises", () => ({
  readFile: readFileMock,
  readdir: readdirMock,
  stat: statMock,
}));

function trustedHeaders() {
  return {
    host: "localhost:3000",
    origin: "http://localhost:3000",
  };
}

const CONFIG_CONTENT = `TEAMS_WINDOW_KEYWORDS=("Call")
POLL_INTERVAL_ACTIVE=10
POLL_INTERVAL_INACTIVE=30
STABILITY_CHECK_DELAY=5
EXPORT_FOLDER="/tmp/recordings"
`;

describe("/api/recordings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    readFileMock.mockResolvedValue(CONFIG_CONTENT);
  });

  it("lists recordings sorted by modified time and includes summary metadata", async () => {
    readdirMock.mockResolvedValue([
      { name: "standup.m4a", isFile: () => true },
      { name: "standup.md", isFile: () => true },
      { name: "retro.m4a", isFile: () => true },
      { name: "notes.txt", isFile: () => true },
    ]);
    statMock
      .mockResolvedValueOnce({ size: 1500, mtime: new Date("2026-02-10T10:00:00Z") })
      .mockResolvedValueOnce({ size: 2500, mtime: new Date("2026-02-11T10:00:00Z") });

    const { GET } = await import("@/app/api/recordings/route");
    const res = await GET(new Request("http://localhost:3000/api/recordings", { headers: trustedHeaders() }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.exportFolder).toBe("/tmp/recordings");
    expect(json.recordings).toHaveLength(2);
    expect(json.recordings[0].name).toBe("retro.m4a");
    expect(json.recordings[0].hasSummary).toBe(false);
    expect(json.recordings[1].name).toBe("standup.m4a");
    expect(json.recordings[1].hasSummary).toBe(true);
  });

  it("rejects non-local origins", async () => {
    const { GET } = await import("@/app/api/recordings/route");
    const res = await GET(
      new Request("http://localhost:3000/api/recordings", {
        headers: {
          host: "localhost:3000",
          origin: "https://example.com",
        },
      }),
    );

    expect(res.status).toBe(403);
  });
});

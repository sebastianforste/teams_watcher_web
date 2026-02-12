// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const readFileMock = vi.fn();
const writeFileMock = vi.fn();

vi.mock("fs/promises", () => ({
  readFile: readFileMock,
  writeFile: writeFileMock,
}));

const VALID_CONFIG_CONTENT = `TEAMS_WINDOW_KEYWORDS=(
  "Call"
  "Meeting"
)
POLL_INTERVAL_ACTIVE=10
POLL_INTERVAL_INACTIVE=30
STABILITY_CHECK_DELAY=5
EXPORT_FOLDER="/Users/sebastian/Developer/teams_recorder/recordings"
`;

function trustedHeaders() {
  return {
    "content-type": "application/json",
    host: "localhost:3000",
    origin: "http://localhost:3000",
  };
}

describe("/api/config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("saves raw config content payload", async () => {
    const { POST } = await import("@/app/api/config/route");

    const res = await POST(
      new Request("http://localhost:3000/api/config", {
        method: "POST",
        headers: trustedHeaders(),
        body: JSON.stringify({ content: VALID_CONFIG_CONTENT }),
      }),
    );

    expect(res.status).toBe(200);
    expect(writeFileMock).toHaveBeenCalledWith(
      expect.stringContaining("engine/config.sh"),
      VALID_CONFIG_CONTENT,
      "utf-8",
    );
  });

  it("saves structured values payload", async () => {
    readFileMock.mockResolvedValue(VALID_CONFIG_CONTENT);
    const { POST } = await import("@/app/api/config/route");

    const res = await POST(
      new Request("http://localhost:3000/api/config", {
        method: "POST",
        headers: trustedHeaders(),
        body: JSON.stringify({
          values: {
            TEAMS_WINDOW_KEYWORDS: ["Call", "Planning"],
            POLL_INTERVAL_ACTIVE: 12,
            POLL_INTERVAL_INACTIVE: 40,
            STABILITY_CHECK_DELAY: 4,
            EXPORT_FOLDER: "/tmp/recordings",
          },
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock.mock.calls[0][1]).toContain('POLL_INTERVAL_ACTIVE=12');
    expect(writeFileMock.mock.calls[0][1]).toContain('EXPORT_FOLDER="/tmp/recordings"');
  });

  it("rejects invalid payload", async () => {
    const { POST } = await import("@/app/api/config/route");

    const res = await POST(
      new Request("http://localhost:3000/api/config", {
        method: "POST",
        headers: trustedHeaders(),
        body: JSON.stringify({ values: { POLL_INTERVAL_ACTIVE: 0 } }),
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("rejects non-local origins", async () => {
    const { POST } = await import("@/app/api/config/route");

    const res = await POST(
      new Request("http://localhost:3000/api/config", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          host: "localhost:3000",
          origin: "https://example.com",
        },
        body: JSON.stringify({ content: VALID_CONFIG_CONTENT }),
      }),
    );

    expect(res.status).toBe(403);
    expect(writeFileMock).not.toHaveBeenCalled();
  });
});

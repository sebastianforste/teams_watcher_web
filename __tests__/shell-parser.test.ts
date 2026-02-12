import { describe, expect, it } from "vitest";
import { parseConfig, updateConfig } from "@/lib/shell-parser";

const BASE_CONFIG = `# Comment
TEAMS_WINDOW_KEYWORDS=(
  "Call" # inline
  "Daily Standup"
)

POLL_INTERVAL_ACTIVE=10
POLL_INTERVAL_INACTIVE=30 # slower when app closed
STABILITY_CHECK_DELAY=5
EXPORT_FOLDER="/Users/sebastian/Developer/teams_recorder/recordings"
`;

describe("shell-parser", () => {
  it("parses arrays and scalar values", () => {
    const parsed = parseConfig(BASE_CONFIG);

    expect(parsed.TEAMS_WINDOW_KEYWORDS).toEqual(["Call", "Daily Standup"]);
    expect(parsed.POLL_INTERVAL_ACTIVE).toBe(10);
    expect(parsed.POLL_INTERVAL_INACTIVE).toBe(30);
    expect(parsed.STABILITY_CHECK_DELAY).toBe(5);
    expect(parsed.EXPORT_FOLDER).toBe("/Users/sebastian/Developer/teams_recorder/recordings");
  });

  it("updates known keys while preserving comments", () => {
    const updated = updateConfig(BASE_CONFIG, {
      TEAMS_WINDOW_KEYWORDS: ["Call", "Budget \"Q1\""],
      POLL_INTERVAL_ACTIVE: 12,
      POLL_INTERVAL_INACTIVE: 45,
      STABILITY_CHECK_DELAY: 7,
      EXPORT_FOLDER: "/tmp/out #1",
    });

    expect(updated).toContain('POLL_INTERVAL_ACTIVE=12');
    expect(updated).toContain('POLL_INTERVAL_INACTIVE=45 # slower when app closed');
    expect(updated).toContain('STABILITY_CHECK_DELAY=7');
    expect(updated).toContain('EXPORT_FOLDER="/tmp/out #1"');
    expect(updated).toContain('"Budget \\"Q1\\""');
  });

  it("appends missing keys when config is incomplete", () => {
    const input = `TEAMS_WINDOW_KEYWORDS=(
  "Call"
)`;
    const updated = updateConfig(input, {
      TEAMS_WINDOW_KEYWORDS: ["Call", "Meeting"],
      POLL_INTERVAL_ACTIVE: 11,
      POLL_INTERVAL_INACTIVE: 40,
      STABILITY_CHECK_DELAY: 6,
      EXPORT_FOLDER: "",
    });

    expect(updated).toContain("POLL_INTERVAL_ACTIVE=11");
    expect(updated).toContain("POLL_INTERVAL_INACTIVE=40");
    expect(updated).toContain("STABILITY_CHECK_DELAY=6");
    expect(updated).toContain('EXPORT_FOLDER=""');
  });
});

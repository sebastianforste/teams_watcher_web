import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const ROOT_DIR = path.resolve(process.cwd(), "..");
const STATE_PATH = path.join(ROOT_DIR, ".companion", "state.json");

export async function GET() {
  try {
    const state = JSON.parse(await readFile(STATE_PATH, "utf8")) as Record<string, Record<string, unknown>>;
    const pending = Object.values(state).filter(
      (item) => item && typeof item === "object" && String(item.status ?? "").toLowerCase() === "accepted"
    );
    return NextResponse.json({
      workspace_name: "teams_recorder",
      pending_actions: pending,
      pending_action_count: pending.length,
      return_to_pending_action: pending[0] ?? null,
      recommended_actions: ["retry_post_process", "acknowledge_incident"],
      continuation_prompt: "Return to pending recording and post-process actions to maintain operational continuity.",
      completion_recap: {
        title: "Recording continuity recap",
        body: "Acknowledge recap after resolution to sustain the weekly monitoring loop.",
        acknowledge_route: "/api/companion/acknowledge-recap",
      },
      generated_at_utc: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      workspace_name: "teams_recorder",
      pending_actions: [],
      pending_action_count: 0,
      return_to_pending_action: null,
      recommended_actions: ["retry_post_process", "acknowledge_incident"],
      continuation_prompt: "Return to pending recording actions as new incidents arrive.",
      completion_recap: {
        title: "Recording continuity recap",
        body: "Acknowledge recap after resolution to sustain the weekly monitoring loop.",
        acknowledge_route: "/api/companion/acknowledge-recap",
      },
      generated_at_utc: new Date().toISOString(),
    });
  }
}

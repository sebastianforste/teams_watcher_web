import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { requireTrustedLocalRequest } from "@/lib/request-guard";
import { appendEventLog, WORKSPACE_NAME } from "@/lib/product-core-events";

const ROOT_DIR = path.resolve(process.cwd(), "..");
const STATE_DIR = path.join(ROOT_DIR, ".companion");
const STATE_PATH = path.join(STATE_DIR, "state.json");

type CompanionState = Record<string, Record<string, unknown>>;

async function readState(): Promise<CompanionState> {
  try {
    const raw = await readFile(STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as CompanionState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeState(state: CompanionState): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function recapSessionId(): string {
  return `recap_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: Request) {
  const trusted = requireTrustedLocalRequest(req);
  if (!trusted.ok) {
    return NextResponse.json({ error: trusted.error }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ accepted: false, error: "invalid_json" }, { status: 400 });
  }

  const workspaceName = String(body.workspace_name ?? "");
  if (workspaceName !== WORKSPACE_NAME) {
    return NextResponse.json({ accepted: false, error: "invalid_workspace_name" }, { status: 400 });
  }

  const providedExecutionId = String(body.execution_id ?? "");
  const acknowledgedAtUtc = new Date().toISOString();
  const state = await readState();
  let executionId = providedExecutionId;

  if (executionId) {
    const record = state[executionId];
    if (!record || typeof record !== "object") {
      return NextResponse.json({ accepted: false, error: "execution_not_found" }, { status: 404 });
    }
    state[executionId] = {
      ...record,
      status: "acknowledged",
      recap_acknowledged_at_utc: acknowledgedAtUtc,
    };
    await writeState(state);
  } else {
    executionId = recapSessionId();
  }

  await appendEventLog({
    event_name: "feature_engaged",
    workspace_name: WORKSPACE_NAME,
    user_id_hash: "companion",
    session_id: executionId,
    platform: "companion_api",
    timestamp_utc: acknowledgedAtUtc,
    properties: {
      feature: "completion_recap_acknowledged",
      retention_surface_id: "teams_recorder_companion_completion_recap_card",
      retention_action_type: "completion_acknowledgment",
      followup_window_day: 7,
      value_loop_stage: "habit_reinforcement",
      fundamental_feature_id: "teams_recorder_transcript_readiness_recap",
      activation_step: "completion_recap_acknowledgment",
      entry_surface: "companion_action",
      release_version: process.env.npm_package_version ?? "1.0.0",
      build_channel: process.env.NODE_ENV ?? "development",
      source: "companion_recap",
    },
  });

  return NextResponse.json({
    accepted: true,
    workspace_name: WORKSPACE_NAME,
    execution_id: executionId,
  });
}

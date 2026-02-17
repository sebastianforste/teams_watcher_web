import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireTrustedLocalRequest } from "@/lib/request-guard";
import { appendActionLog, appendEventLog, WORKSPACE_NAME } from "@/lib/product-core-events";

const ROOT_DIR = path.resolve(process.cwd(), "..");
const STATE_DIR = path.join(ROOT_DIR, ".companion");
const STATE_PATH = path.join(STATE_DIR, "state.json");

const SUPPORTED_ACTIONS = [
  "start_recording",
  "stop_recording",
  "retry_post_process",
  "pause_detector",
  "resume_detector",
  "acknowledge_incident",
] as const;
const SUPPORTED_ACTION_SET = new Set<string>(SUPPORTED_ACTIONS);
const FEATURE_FLAG_KEY = "enable_teams_recorder_remote_control";
const ACTIONS_LOG_PATH = path.join(ROOT_DIR, ".telemetry", "actions.ndjson");

const CompanionActionSchema = z.object({
  workspace_name: z.literal(WORKSPACE_NAME),
  action_type: z.string().min(1),
  target_id: z.string().min(1),
  requested_by: z.string().min(1),
  requested_at_utc: z.string().min(1),
});

type CompanionState = Record<string, Record<string, unknown>>;

async function hasExistingActions(): Promise<boolean> {
  try {
    const raw = await readFile(ACTIONS_LOG_PATH, "utf8");
    return raw.split("\n").some((line) => line.trim().length > 0);
  } catch {
    return false;
  }
}

async function readState(): Promise<CompanionState> {
  try {
    const raw = await readFile(STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as CompanionState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function executionId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseEnvBoolean(value: string | undefined): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
}

function isFeatureFlagEnabled(flagKey: string): boolean {
  const payload = process.env.PRODUCT_CORE_FEATURE_FLAGS;
  if (payload) {
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      const value = parsed[flagKey];
      if (typeof value === "boolean") {
        return value;
      }
    } catch {
      // Ignore malformed payload and fall back to direct environment checks.
    }
  }

  const direct =
    parseEnvBoolean(process.env[flagKey]) ??
    parseEnvBoolean(process.env[flagKey.toUpperCase()]) ??
    parseEnvBoolean(process.env[`FLAG_${flagKey.toUpperCase()}`]);
  return direct ?? false;
}

export async function POST(req: Request) {
  const trusted = requireTrustedLocalRequest(req);
  if (!trusted.ok) {
    return NextResponse.json({ error: trusted.error }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CompanionActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const actionType = parsed.data.action_type;
  if (!SUPPORTED_ACTION_SET.has(actionType)) {
    return NextResponse.json(
      { accepted: false, error: "unsupported_action", supported_actions: SUPPORTED_ACTIONS },
      { status: 400 },
    );
  }
  if (!isFeatureFlagEnabled(FEATURE_FLAG_KEY)) {
    const rejectedAtUtc = new Date().toISOString();
    await appendEventLog({
      event_name: "error_shown",
      workspace_name: WORKSPACE_NAME,
      user_id_hash: "companion",
      session_id: executionId(),
      platform: "companion_api",
      timestamp_utc: rejectedAtUtc,
      properties: {
        source: "companion_action",
        message: "feature_flag_disabled",
        flag_key: FEATURE_FLAG_KEY,
        requested_action: actionType,
        entry_surface: "companion_action",
        release_version: process.env.npm_package_version ?? "1.0.0",
        build_channel: process.env.NODE_ENV ?? "development",
      },
    });
    return NextResponse.json(
      { accepted: false, error: "feature_flag_disabled", flag_key: FEATURE_FLAG_KEY },
      { status: 403 },
    );
  }

  const id = executionId();
  const acceptedAtUtc = new Date().toISOString();
  const firstAction = !(await hasExistingActions());
  const actionRecord = {
    execution_id: id,
    workspace_name: parsed.data.workspace_name,
    action_type: actionType,
    target_id: parsed.data.target_id,
    requested_by: parsed.data.requested_by,
    requested_at_utc: parsed.data.requested_at_utc,
    accepted_at_utc: acceptedAtUtc,
    status: "accepted",
  };

  await mkdir(STATE_DIR, { recursive: true });
  const state = await readState();
  state[id] = actionRecord;
  await writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await appendActionLog(actionRecord);
  if (firstAction) {
    await appendEventLog({
      event_name: "session_started",
      workspace_name: WORKSPACE_NAME,
      user_id_hash: "companion",
      session_id: id,
      platform: "companion_api",
      timestamp_utc: acceptedAtUtc,
      properties: {
        entry: "companion_action",
        entry_surface: "companion_action",
        release_version: process.env.npm_package_version ?? "1.0.0",
        build_channel: process.env.NODE_ENV ?? "development",
      },
    });
    await appendEventLog({
      event_name: "onboarding_completed",
      workspace_name: WORKSPACE_NAME,
      user_id_hash: "companion",
      session_id: id,
      platform: "companion_api",
      timestamp_utc: acceptedAtUtc,
      properties: {
        flow: "first_companion_action",
        entry_surface: "companion_action",
        release_version: process.env.npm_package_version ?? "1.0.0",
        build_channel: process.env.NODE_ENV ?? "development",
      },
    });
    await appendEventLog({
      event_name: "first_value_completed",
      workspace_name: WORKSPACE_NAME,
      user_id_hash: "companion",
      session_id: id,
      platform: "companion_api",
      timestamp_utc: acceptedAtUtc,
      properties: {
        value_surface: "first_companion_action",
        entry_surface: "companion_action",
        release_version: process.env.npm_package_version ?? "1.0.0",
        build_channel: process.env.NODE_ENV ?? "development",
      },
    });
  }
  await appendEventLog({
    event_name: "feature_engaged",
    workspace_name: WORKSPACE_NAME,
    user_id_hash: "companion",
    session_id: id,
    platform: "companion_api",
    timestamp_utc: acceptedAtUtc,
    properties: {
      feature: actionType,
      entry_surface: "companion_action",
      release_version: process.env.npm_package_version ?? "1.0.0",
      build_channel: process.env.NODE_ENV ?? "development",
    },
  });

  return NextResponse.json({
    accepted: true,
    execution_id: id,
    status_url: `/api/companion/status/${id}`,
  });
}

import { appendFile, mkdir } from "fs/promises";
import path from "path";

export const WORKSPACE_NAME = "teams_recorder";
export const ALLOWED_EVENT_NAMES = new Set([
  "session_started",
  "onboarding_completed",
  "first_value_completed",
  "feature_engaged",
  "purchase_or_upgrade_initiated",
  "error_shown",
  "session_ended",
]);

const ROOT_DIR = path.resolve(process.cwd(), "..");
const TELEMETRY_DIR = path.join(ROOT_DIR, ".telemetry");
const EVENTS_LOG_PATH = path.join(TELEMETRY_DIR, "events.ndjson");
const ACTIONS_LOG_PATH = path.join(TELEMETRY_DIR, "actions.ndjson");

export type ProductCoreEventPayload = {
  event_name: string;
  workspace_name: string;
  user_id_hash: string;
  session_id: string;
  platform: string;
  timestamp_utc: string;
  properties: Record<string, string | number | boolean>;
};

export async function appendEventLog(payload: ProductCoreEventPayload): Promise<void> {
  await mkdir(TELEMETRY_DIR, { recursive: true });
  await appendFile(EVENTS_LOG_PATH, `${JSON.stringify(payload)}\n`, "utf8");
}

export async function appendActionLog(payload: Record<string, unknown>): Promise<void> {
  await mkdir(TELEMETRY_DIR, { recursive: true });
  await appendFile(ACTIONS_LOG_PATH, `${JSON.stringify(payload)}\n`, "utf8");
}

export function isValidEventPayload(payload: unknown): payload is ProductCoreEventPayload {
  if (!payload || typeof payload !== "object") return false;
  const value = payload as Record<string, unknown>;
  const required = [
    "event_name",
    "workspace_name",
    "user_id_hash",
    "session_id",
    "platform",
    "timestamp_utc",
    "properties",
  ];
  for (const key of required) {
    if (!(key in value)) return false;
  }
  if (value.workspace_name !== WORKSPACE_NAME) return false;
  if (typeof value.event_name !== "string" || !ALLOWED_EVENT_NAMES.has(value.event_name)) return false;
  if (typeof value.user_id_hash !== "string") return false;
  if (typeof value.session_id !== "string") return false;
  if (typeof value.platform !== "string") return false;
  if (typeof value.timestamp_utc !== "string") return false;
  if (!value.properties || typeof value.properties !== "object" || Array.isArray(value.properties)) return false;
  return true;
}

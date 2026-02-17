import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import os from 'os';
import { z } from 'zod';
import { requireTrustedLocalRequest } from '@/lib/request-guard';
import { appendActionLog, appendEventLog, WORKSPACE_NAME } from '@/lib/product-core-events';

const PLIST_NAME = 'com.sebastian.teams-voice-record.plist';
const PLIST_PATH = path.join(os.homedir(), 'Library/LaunchAgents', PLIST_NAME);
const ControlActionSchema = z.object({
  action: z.enum(['start', 'restart', 'stop']),
});

function runLaunchctl(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('/bin/launchctl', args, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function POST(req: Request) {
  const trusted = requireTrustedLocalRequest(req);
  if (!trusted.ok) {
    return NextResponse.json({ error: trusted.error }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = ControlActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { action } = parsed.data;

    if (action === 'start' || action === 'restart') {
      try {
        await runLaunchctl(['unload', PLIST_PATH]);
      } catch {
        // If not currently loaded, ignore and continue.
      }
      await runLaunchctl(['load', PLIST_PATH]);
      const now = new Date().toISOString();
      await appendActionLog({
        workspace_name: WORKSPACE_NAME,
        action_type: action === 'start' ? 'start_recording' : 'retry_post_process',
        target_id: "launch_agent",
        requested_by: "dashboard_control",
        requested_at_utc: now,
        accepted_at_utc: now,
        status: "accepted",
      });
      await appendEventLog({
        event_name: "feature_engaged",
        workspace_name: WORKSPACE_NAME,
        user_id_hash: "dashboard_control",
        session_id: `control_${Date.now()}`,
        platform: "web",
        timestamp_utc: now,
        properties: {
          feature: action,
          entry_surface: "control_api",
          release_version: process.env.npm_package_version ?? "1.0.0",
          build_channel: process.env.NODE_ENV ?? "development",
        },
      });
      return NextResponse.json({ message: action === 'start' ? 'Service started' : 'Service restarted' });
    }

    await runLaunchctl(['unload', PLIST_PATH]);
    const now = new Date().toISOString();
    await appendActionLog({
      workspace_name: WORKSPACE_NAME,
      action_type: 'stop_recording',
      target_id: "launch_agent",
      requested_by: "dashboard_control",
      requested_at_utc: now,
      accepted_at_utc: now,
      status: "accepted",
    });
    await appendEventLog({
      event_name: "feature_engaged",
      workspace_name: WORKSPACE_NAME,
      user_id_hash: "dashboard_control",
      session_id: `control_${Date.now()}`,
      platform: "web",
      timestamp_utc: now,
      properties: {
        feature: action,
        entry_surface: "control_api",
        release_version: process.env.npm_package_version ?? "1.0.0",
        build_channel: process.env.NODE_ENV ?? "development",
      },
    });
    return NextResponse.json({ message: 'Service stopped' });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown control error";
    await appendEventLog({
      event_name: "error_shown",
      workspace_name: WORKSPACE_NAME,
      user_id_hash: "dashboard_control",
      session_id: `control_error_${Date.now()}`,
      platform: "web",
      timestamp_utc: new Date().toISOString(),
      properties: {
        source: "control_api",
        message,
        release_version: process.env.npm_package_version ?? "1.0.0",
        build_channel: process.env.NODE_ENV ?? "development",
        entry_surface: "control_api",
      },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

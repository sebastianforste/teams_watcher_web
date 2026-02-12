import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import os from 'os';
import { z } from 'zod';
import { requireTrustedLocalRequest } from '@/lib/request-guard';

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
      return NextResponse.json({ message: action === 'start' ? 'Service started' : 'Service restarted' });
    }

    await runLaunchctl(['unload', PLIST_PATH]);
    return NextResponse.json({ message: 'Service stopped' });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown control error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

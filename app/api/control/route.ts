import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import os from 'os';

const execAsync = util.promisify(exec);
const PLIST_NAME = 'com.sebastian.teams-voice-record.plist';
const PLIST_PATH = path.join(os.homedir(), 'Library/LaunchAgents', PLIST_NAME);

export async function POST(req: Request) {
  const body = await req.json();
  const action = body.action;

  try {
    if (action === 'start' || action === 'restart') {
      try {
        await execAsync(`launchctl unload ${PLIST_PATH}`);
      } catch (e) {
        // Find if not loaded, ignore error
      }
      await execAsync(`launchctl load ${PLIST_PATH}`);
    } else if (action === 'stop') {
      await execAsync(`launchctl unload ${PLIST_PATH}`);
    }

    return NextResponse.json({ message: `Service ${action}ed` });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

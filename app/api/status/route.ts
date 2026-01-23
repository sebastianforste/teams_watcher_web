import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

export async function GET() {
  const statusFile = path.join(os.homedir(), '.teams_watcher_status');
  const logFile = path.join(os.homedir(), 'Library/Logs/TeamsVoiceMemos.log');

  let statusData: Record<string, string> = { state: 'unknown' };
  let logs: string[] = [];

  try {
    const rawStatus = await readFile(statusFile, 'utf-8');
    rawStatus.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        statusData[key.trim()] = value.trim();
      }
    });
  } catch (e) {
    // Status file might not exist if script never ran
  }

  try {
    const rawLogs = await readFile(logFile, 'utf-8');
    const allLines = rawLogs.split('\n');
    logs = allLines.slice(-50).filter(Boolean); // Last 50 lines
  } catch (e) {
    // Log file might not exist
  }

  return NextResponse.json({
    status: statusData,
    logs: logs
  });
}

import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { ConfigSchema } from '@/lib/config-schema';
import { parseConfig, updateConfig } from '@/lib/shell-parser';
import { requireTrustedLocalRequest } from '@/lib/request-guard';

const CONFIG_PATH = path.join(process.cwd(), '../engine/config.sh');
const RawConfigPayloadSchema = z.object({
  content: z.string().min(1),
});
const REQUIRED_CONFIG_KEYS = [
  'TEAMS_WINDOW_KEYWORDS',
  'POLL_INTERVAL_ACTIVE',
  'POLL_INTERVAL_INACTIVE',
  'STABILITY_CHECK_DELAY',
  'EXPORT_FOLDER',
];

function hasRequiredConfigKeys(content: string): boolean {
  return REQUIRED_CONFIG_KEYS.every((key) => new RegExp(`^\\s*${key}=`, 'm').test(content));
}

export async function GET(req: Request) {
  const trusted = requireTrustedLocalRequest(req);
  if (!trusted.ok) {
    return NextResponse.json({ error: trusted.error }, { status: 403 });
  }

  try {
    const content = await readFile(CONFIG_PATH, 'utf-8');
    // Return both raw content (for archival) and parsed values (for form)
    const values = parseConfig(content);
    return NextResponse.json({ content, values });
  } catch {
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const trusted = requireTrustedLocalRequest(req);
  if (!trusted.ok) {
    return NextResponse.json({ error: trusted.error }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);

    // Backward-compatible payload for the existing textarea editor.
    const rawPayload = RawConfigPayloadSchema.safeParse(body);
    if (rawPayload.success) {
      if (!hasRequiredConfigKeys(rawPayload.data.content)) {
        return NextResponse.json({ error: 'Config content is missing required keys' }, { status: 400 });
      }

      const parsedValues = ConfigSchema.safeParse(parseConfig(rawPayload.data.content));
      if (!parsedValues.success) {
        return NextResponse.json({ error: parsedValues.error.issues }, { status: 400 });
      }

      await writeFile(CONFIG_PATH, rawPayload.data.content, 'utf-8');
      return NextResponse.json({ message: 'Saved', values: parsedValues.data });
    }

    // Structured payload for form-based clients.
    const valuesResult = ConfigSchema.safeParse(body?.values);
    if (!valuesResult.success) {
      return NextResponse.json({ error: valuesResult.error.issues }, { status: 400 });
    }

    const currentContent = await readFile(CONFIG_PATH, 'utf-8');
    const newContent = updateConfig(currentContent, valuesResult.data);
    await writeFile(CONFIG_PATH, newContent, 'utf-8');
    return NextResponse.json({ message: 'Saved', values: valuesResult.data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}

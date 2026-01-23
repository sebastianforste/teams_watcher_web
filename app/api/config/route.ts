import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), '../teams_voice_memos/config.sh');

export async function GET() {
  try {
    const content = await readFile(CONFIG_PATH, 'utf-8');
    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    await writeFile(CONFIG_PATH, content, 'utf-8');
    return NextResponse.json({ message: 'Saved' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}

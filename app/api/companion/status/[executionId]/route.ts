import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const ROOT_DIR = path.resolve(process.cwd(), "..");
const STATE_PATH = path.join(ROOT_DIR, ".companion", "state.json");

export async function GET(_: Request, context: { params: Promise<{ executionId: string }> }) {
  const { executionId } = await context.params;

  try {
    const state = JSON.parse(await readFile(STATE_PATH, "utf8")) as Record<string, unknown>;
    const item = state[executionId];
    if (!item) {
      return NextResponse.json({ error: "execution_not_found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "execution_not_found" }, { status: 404 });
  }
}

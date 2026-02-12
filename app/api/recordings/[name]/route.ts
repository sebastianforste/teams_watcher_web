import { NextResponse } from "next/server";
import { createReadStream } from "fs";
import { readFile, stat } from "fs/promises";
import { Readable } from "stream";
import path from "path";
import { parseConfig } from "@/lib/shell-parser";
import { requireTrustedLocalRequest } from "@/lib/request-guard";

const CONFIG_PATH = path.join(process.cwd(), "../engine/config.sh");
const DEFAULT_EXPORT_FOLDER = path.join(process.cwd(), "../recordings");
const ALLOWED_EXTENSIONS = new Set([".m4a", ".md"]);

async function resolveExportFolder(): Promise<string> {
  try {
    const content = await readFile(CONFIG_PATH, "utf-8");
    const parsed = parseConfig(content);
    if (parsed.EXPORT_FOLDER && parsed.EXPORT_FOLDER.trim()) {
      return parsed.EXPORT_FOLDER.trim();
    }
  } catch {
    // Fall back to default recordings directory.
  }
  return DEFAULT_EXPORT_FOLDER;
}

function getContentType(ext: string): string {
  if (ext === ".md") {
    return "text/markdown; charset=utf-8";
  }
  return "audio/mp4";
}

export async function GET(
  req: Request,
  context: { params: Promise<{ name: string }> },
) {
  const trusted = requireTrustedLocalRequest(req);
  if (!trusted.ok) {
    return NextResponse.json({ error: trusted.error }, { status: 403 });
  }

  const { name } = await context.params;
  const decoded = decodeURIComponent(name);
  if (decoded.includes("/") || decoded.includes("\\") || decoded.includes("..")) {
    return NextResponse.json({ error: "Invalid recording name" }, { status: 400 });
  }

  const ext = path.extname(decoded).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const exportFolder = await resolveExportFolder();
  const filePath = path.join(exportFolder, decoded);

  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  const stream = createReadStream(filePath);
  const body = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

  return new Response(body, {
    headers: {
      "content-type": getContentType(ext),
      "content-disposition": `inline; filename="${decoded}"`,
      "cache-control": "no-store",
    },
  });
}

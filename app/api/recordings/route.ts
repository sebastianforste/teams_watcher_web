import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";
import { parseConfig } from "@/lib/shell-parser";
import { requireTrustedLocalRequest } from "@/lib/request-guard";

const CONFIG_PATH = path.join(process.cwd(), "../engine/config.sh");
const DEFAULT_EXPORT_FOLDER = path.join(process.cwd(), "../recordings");

type RecordingItem = {
  name: string;
  size: number;
  modifiedAt: string;
  hasSummary: boolean;
  hasTranscript: boolean;
};

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

export async function GET(req: Request) {
  const trusted = requireTrustedLocalRequest(req);
  if (!trusted.ok) {
    return NextResponse.json({ error: trusted.error }, { status: 403 });
  }

  try {
    const exportFolder = await resolveExportFolder();
    const entries = await readdir(exportFolder, { withFileTypes: true });
    const markdownFiles = new Set<string>();
    const recordings: RecordingItem[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      const fullPath = path.join(exportFolder, entry.name);

      if (ext === ".md") {
        markdownFiles.add(entry.name);
        continue;
      }
      if (ext !== ".m4a") {
        continue;
      }

      const fileStat = await stat(fullPath);
      recordings.push({
        name: entry.name,
        size: fileStat.size,
        modifiedAt: fileStat.mtime.toISOString(),
        hasSummary: false,
        hasTranscript: false,
      });
    }

    for (const item of recordings) {
      const baseName = path.basename(item.name, ".m4a");
      item.hasSummary = markdownFiles.has(`${baseName}_summary.md`) || markdownFiles.has(`${baseName}.md`);
      item.hasTranscript = markdownFiles.has(`${baseName}_transcript.md`);
    }

    recordings.sort((a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt));

    return NextResponse.json({
      exportFolder,
      recordings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list recordings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

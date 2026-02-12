import { NextResponse } from "next/server";
import { getSnapshotOptions, readWatcherSnapshot } from "@/lib/status-snapshot";

export async function GET(req?: Request) {
  const snapshot = await readWatcherSnapshot(getSnapshotOptions(req));
  return NextResponse.json(snapshot);
}

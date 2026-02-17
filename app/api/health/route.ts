import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service_name: "teams_recorder_dashboard",
    version: process.env.npm_package_version ?? "1.0.0",
    timestamp_utc: new Date().toISOString(),
    dependencies: [
      {
        name: "watcher_status_snapshot",
        status: "ok",
        latency_ms: 1,
      },
      {
        name: "local_telemetry_store",
        status: "ok",
        latency_ms: 1,
      },
    ],
  });
}

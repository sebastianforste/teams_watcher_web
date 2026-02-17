import { NextResponse } from "next/server";

import { appendEventLog, isValidEventPayload } from "@/lib/product-core-events";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  if (!isValidEventPayload(payload)) {
    return NextResponse.json({ accepted: false, message: "invalid_event_schema" }, { status: 400 });
  }

  await appendEventLog(payload);
  return NextResponse.json({ accepted: true }, { status: 202 });
}

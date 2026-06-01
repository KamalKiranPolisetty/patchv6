import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendMessage } from "@/lib/conversation";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { incidentId?: string | null; category?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const content = (body.content ?? "").trim();
  const category = (body.category ?? "VDI").trim() || "VDI";
  const incidentId = body.incidentId ?? null;
  if (!content) {
    return NextResponse.json({ error: "Message content is required." }, { status: 400 });
  }

  try {
    const result = await sendMessage({
      userId: user.id,
      incidentId,
      category,
      content,
    });
    return NextResponse.json({
      incident: result.incident,
      payload: result.payload,
      kbReferences: result.kbReferences,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to process message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import { getKbForCategory, getAllKbBlocks, formatKbContext } from "@/lib/kb";
import { buildSystemPrompt, callLlm } from "@/lib/llm";
import type { HistoryEntry } from "@/lib/types";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { incidentId, message, category } = await req.json();

  if (!incidentId || !message) {
    return NextResponse.json({ error: "incidentId and message are required." }, { status: 400 });
  }

  const db = await getDb();

  // Find the incident
  const filter: Record<string, unknown> = { userId: user.userId };
  if (ObjectId.isValid(incidentId)) {
    filter._id = new ObjectId(incidentId);
  } else {
    filter.incidentId = incidentId;
  }

  const incident = await db.collection("patch_transactions").findOne(filter);
  if (!incident) return NextResponse.json({ error: "Incident not found." }, { status: 404 });

  // Get KB context
  const kbBlocks = category
    ? getKbForCategory(category)
    : getAllKbBlocks();
  const kbText = formatKbContext(kbBlocks);

  // Build conversation history for LLM
  const history = (incident.history as HistoryEntry[]) || [];
  const llmHistory = history.map((h) => ({ role: h.role, content: h.content }));
  llmHistory.push({ role: "user", content: message });

  // Call LLM
  const systemPrompt = buildSystemPrompt(kbText);
  const llmResponse = await callLlm(systemPrompt, llmHistory);

  const now = new Date();
  const userEntry: HistoryEntry = { role: "user", content: message, timestamp: now };
  const assistantEntry: HistoryEntry = {
    role: "assistant",
    content: llmResponse.response,
    timestamp: new Date(),
  };

  const updateFields: Record<string, unknown> = { updatedAt: now };
  const pushEntries = [userEntry, assistantEntry];

  if (llmResponse.should_escalate && llmResponse.escalation_data) {
    updateFields.status = "Escalated";
    updateFields.escalation = {
      ...llmResponse.escalation_data,
      escalatedAt: now,
    };
    updateFields.lastUpdatedBy = "Escalation Team";
  } else if (llmResponse.should_resolve) {
    updateFields.status = "Resolved";
    updateFields.resolution = { details: llmResponse.response, timestamp: now };
    updateFields.lastUpdatedBy = "Patch";
  }

  // Store KB references
  if (kbBlocks.length > 0) {
    updateFields.kbContext = kbBlocks.map((b) => ({ file: b.file, text: b.text.substring(0, 500) }));
  }

  // MongoDB push operator typing requires casting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db.collection("patch_transactions") as any).updateOne(filter, {
    $set: updateFields,
    $push: { history: { $each: pushEntries } },
  });

  return NextResponse.json({
    response: llmResponse,
    incidentId: incident.incidentId,
  });
}

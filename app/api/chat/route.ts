import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { callLLM } from "@/lib/llm";
import { readKBFile, getAllKBFiles, formatKBContext } from "@/lib/kb";
import type { Message } from "@/types";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { incidentId, message, category } = await req.json();

  if (!incidentId || !message) {
    return NextResponse.json({ error: "incidentId and message are required" }, { status: 400 });
  }

  const db = await getDb();
  const incident = await db
    .collection("Patch Transactions")
    .findOne({ _id: new ObjectId(incidentId) });

  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  // Load KB context
  let kbContext = "";
  let kbRefs: string[] = [];

  if (category) {
    const content = readKBFile(category);
    if (content) {
      kbContext = `[CATEGORY: ${category.toUpperCase()} | FILE: ${category.toLowerCase()}.md]\n${content}`;
      kbRefs = [`${category.toLowerCase()}.md`];
    }
  } else {
    const files = getAllKBFiles();
    if (files.length > 0) {
      kbContext = formatKBContext(files);
      kbRefs = files.map((f) => f.filename);
    }
  }

  const userMsg: Message = { role: "user", content: message, timestamp: new Date() };
  const now = new Date();

  // Append user message
  await db.collection("Patch Transactions").updateOne(
    { _id: new ObjectId(incidentId) },
    {
      $push: { conversationHistory: userMsg } as never,
      $set: { updatedAt: now, kbReferences: kbRefs },
    }
  );

  // Get conversation history (exclude the just-added message)
  const history = (incident.conversationHistory || []) as Message[];

  // Call LLM
  const llmResponse = await callLLM([userMsg], kbContext, history);

  const assistantMsg: Message = {
    role: "assistant",
    content: llmResponse.response,
    timestamp: new Date(),
  };

  // Append assistant message
  await db.collection("Patch Transactions").updateOne(
    { _id: new ObjectId(incidentId) },
    {
      $push: { conversationHistory: assistantMsg } as never,
      $set: { updatedAt: new Date() },
    }
  );

  // Handle escalation
  if (llmResponse.should_escalate && incident.status === "Open") {
    await db.collection("Patch Transactions").updateOne(
      { _id: new ObjectId(incidentId) },
      {
        $set: {
          status: "Escalated",
          escalationDetails: { ...llmResponse.escalation_data, timestamp: new Date() },
          updatedAt: new Date(),
        },
        $push: {
          timeline: { event: "Escalated", timestamp: new Date() },
        } as never,
      }
    );
  }

  // Handle resolution
  if (llmResponse.is_resolved && incident.status === "Open") {
    await db.collection("Patch Transactions").updateOne(
      { _id: new ObjectId(incidentId) },
      {
        $set: {
          status: "Resolved",
          resolutionDetails: { summary: llmResponse.response, timestamp: new Date() },
          updatedAt: new Date(),
        },
        $push: {
          timeline: { event: "Resolved", timestamp: new Date() },
        } as never,
      }
    );
  }

  return NextResponse.json(llmResponse);
}

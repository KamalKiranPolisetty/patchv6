import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { chatWithOllama, Message } from "@/lib/ollama";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { message, incidentId, category } = await req.json();
    const db = await getDb();

    let incident: Record<string, unknown> | null = null;
    let isNew = false;

    if (incidentId) {
      incident = await db.collection("PatchTransactions").findOne({ _id: new ObjectId(incidentId) });
    }

    if (!incident) {
      isNew = true;
      const insertResult = await db.collection("PatchTransactions").insertOne({
        userId: new ObjectId(session.id),
        category: category || "Unknown",
        status: "Open",
        conversationHistory: [],
        timeline: [{ status: "Open", timestamp: new Date(), actor: session.username || session.email }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      incident = await db.collection("PatchTransactions").findOne({ _id: insertResult.insertedId });
    }

    const history = (incident!.conversationHistory as Array<{ role: string; content: string }>) || [];

    // Retrieve document context
    const docQuery = category ? { category } : {};
    const docs = await db.collection("KnowledgeBase").find(docQuery).toArray();
    const context = docs.map((d: Record<string, unknown>) => d.extractedText as string).join("\n\n").slice(0, 4000);

    const systemPrompt = `You are Patch, an IT support chatbot helping store associates troubleshoot technical issues.
Current incident category: ${incident!.category}
Current incident status: ${incident!.status}
${context ? `\nKnowledge base context:\n${context}` : ""}

Guidelines:
- Be concise and helpful
- Guide users through troubleshooting step by step
- If you determine the issue is resolved, end your response with [STATUS:RESOLVED]
- If you cannot resolve the issue after exhausting options, end your response with [STATUS:ESCALATED]
- Otherwise, if actively troubleshooting, end your response with [STATUS:IN_PROGRESS]
- Never re-ask questions already answered in conversation history
- Treat each user message as a continuation of the troubleshooting flow`;

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user", content: message },
    ];

    let assistantMessage: string;
    try {
      assistantMessage = await chatWithOllama(messages);
    } catch {
      return NextResponse.json(
        { error: "Patch is having trouble connecting. Please try again in a moment." },
        { status: 503 }
      );
    }

    // Parse status from LLM response
    let newStatus = incident!.status as string;
    let cleanMessage = assistantMessage;

    if (assistantMessage.includes("[STATUS:RESOLVED]")) {
      newStatus = "Resolved";
      cleanMessage = assistantMessage.replace("[STATUS:RESOLVED]", "").trim();
    } else if (assistantMessage.includes("[STATUS:ESCALATED]")) {
      newStatus = "Escalated";
      cleanMessage = assistantMessage.replace("[STATUS:ESCALATED]", "").trim();
    } else if (assistantMessage.includes("[STATUS:IN_PROGRESS]")) {
      newStatus = "In Progress";
      cleanMessage = assistantMessage.replace("[STATUS:IN_PROGRESS]", "").trim();
    }

    const now = new Date();
    const updatedHistory = [
      ...history,
      { role: "user", content: message, timestamp: now },
      { role: "assistant", content: cleanMessage, timestamp: now },
    ];

    const updateData: Record<string, unknown> = {
      conversationHistory: updatedHistory,
      status: newStatus,
      updatedAt: now,
    };

    const timeline = (incident!.timeline as Array<{ status: string }>) || [];
    if (newStatus !== incident!.status) {
      updateData.timeline = [
        ...timeline,
        { status: newStatus, timestamp: now, actor: "Patch AI" },
      ];

      if (newStatus === "Escalated") {
        updateData.escalationDetails = {
          reason: "AI unable to resolve issue",
          group: "Trusted Experts",
          timestamp: now,
        };
      }
      if (newStatus === "Resolved") {
        updateData.resolutionDetails = "Issue resolved through AI-guided troubleshooting";
      }
    }

    await db.collection("PatchTransactions").updateOne(
      { _id: new ObjectId(incident!._id as string) },
      { $set: updateData }
    );

    return NextResponse.json({
      message: cleanMessage,
      incidentId: incident!._id,
      status: newStatus,
      isNew,
      category: incident!.category,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

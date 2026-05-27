import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = "gemma4:31b-cloud";

const SYSTEM_PROMPT = `You are Patch, an AI IT support agent helping store associates troubleshoot technical issues.
Your role is to:
1. Guide users through troubleshooting steps based on provided documentation
2. Ask clear, focused questions one at a time
3. Use the conversation history and document context to provide relevant solutions
4. Determine when an issue is resolved or needs escalation

When you determine the issue is RESOLVED, respond with exactly this format at the end:
[RESOLVED] Brief resolution summary

When you determine the issue CANNOT be resolved and needs escalation, respond with exactly this format at the end:
[ESCALATED] Reason: <brief reason> | Group: IT Support Level 2

Always be professional, clear, and concise.`;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, incidentId, category } = await req.json();
    const db = await getDb();

    // Fetch incident with conversation history
    const incident = await db.collection("Patch Transactions").findOne({ _id: new ObjectId(incidentId) });
    if (!incident) return NextResponse.json({ error: "Incident not found." }, { status: 404 });

    // Retrieve document context
    let docContext = "";
    const effectiveCategory = category || incident.category;
    if (effectiveCategory) {
      const doc = await db.collection("Documents").findOne({ category: effectiveCategory });
      if (doc) docContext = `\n\nRelevant documentation for ${effectiveCategory}:\n${(doc.content as string).slice(0, 3000)}`;
    } else {
      const docs = await db.collection("Documents").find({}).toArray();
      if (docs.length > 0) {
        docContext = "\n\nAvailable documentation:\n" + docs.map((d) => `[${d.category}]: ${(d.content as string).slice(0, 1000)}`).join("\n\n");
      }
    }

    // Build messages for Ollama
    const messages = [
      { role: "system", content: SYSTEM_PROMPT + docContext },
      ...(incident.conversationHistory as Array<{ role: string; content: string }>).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // Call Ollama
    let assistantReply = "";
    try {
      const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages, stream: false }),
      });
      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        assistantReply = data.message?.content || "I'm having trouble connecting. Please try again.";
      } else {
        assistantReply = "I'm currently unavailable. Please try again later.";
      }
    } catch {
      assistantReply = "I'm currently unavailable. Please try again later.";
    }

    const now = new Date();

    // Add user message to history
    await db.collection("Patch Transactions").updateOne(
      { _id: new ObjectId(incidentId) },
      { $push: { conversationHistory: { role: "user", content: message, timestamp: now } } as never }
    );

    // Add assistant message to history
    await db.collection("Patch Transactions").updateOne(
      { _id: new ObjectId(incidentId) },
      { $push: { conversationHistory: { role: "assistant", content: assistantReply, timestamp: new Date() } } as never }
    );

    // Detect state transitions
    let newStatus: string | null = null;
    let escalationDetails = null;
    let resolutionDetails = null;

    if (assistantReply.includes("[RESOLVED]")) {
      newStatus = "Resolved";
      resolutionDetails = { notes: assistantReply.replace("[RESOLVED]", "").trim(), timestamp: now };
    } else if (assistantReply.includes("[ESCALATED]")) {
      newStatus = "Escalated";
      const reasonMatch = assistantReply.match(/Reason:\s*([^|]+)/);
      const groupMatch = assistantReply.match(/Group:\s*(.+)/);
      escalationDetails = {
        reason: reasonMatch ? reasonMatch[1].trim() : "Unable to resolve",
        group: groupMatch ? groupMatch[1].trim() : "IT Support Level 2",
        timestamp: now,
      };
    } else if (incident.status === "Open") {
      newStatus = "In Progress";
    }

    if (newStatus && newStatus !== incident.status) {
      await db.collection("Patch Transactions").updateOne(
        { _id: new ObjectId(incidentId) },
        {
          $set: {
            status: newStatus,
            updatedAt: now,
            ...(escalationDetails ? { escalationDetails } : {}),
            ...(resolutionDetails ? { resolutionDetails } : {}),
          },
          $push: { timeline: { status: newStatus, timestamp: now, actor: "Patch" } } as never,
        }
      );
    } else {
      await db.collection("Patch Transactions").updateOne(
        { _id: new ObjectId(incidentId) },
        { $set: { updatedAt: now } }
      );
    }

    return NextResponse.json({ reply: assistantReply, status: newStatus || incident.status });
  } catch {
    return NextResponse.json({ error: "Failed to process message." }, { status: 500 });
  }
}

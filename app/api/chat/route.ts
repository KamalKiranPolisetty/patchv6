import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/lib/models/transaction";
import { getKBContext } from "@/lib/kb";
import { callLLM, ChatMessage } from "@/lib/llm";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    message: string;
    history?: ChatMessage[];
    category?: string;
    incidentId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { message, history = [], category, incidentId } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  // Retrieve KB context
  const kbContext = await getKBContext(category);

  // Call LLM
  let llmResult;
  try {
    llmResult = await callLLM(message, history, kbContext);
  } catch (err) {
    console.error("[chat] LLM error:", err);
    return NextResponse.json({ error: "LLM unavailable." }, { status: 503 });
  }

  // Persist to MongoDB
  await connectDB();

  const sessionId = session.userId;
  const newIncidentId = incidentId ?? uuidv4();

  const userMsg = {
    role: "user" as const,
    content: message,
    timestamp: new Date(),
  };

  const assistantMsg = {
    role: "assistant" as const,
    content: llmResult.response,
    timestamp: new Date(),
    controlMetadata: llmResult.user_probable_options.length > 0
      ? {
          type: "probable_options" as const,
          options: llmResult.user_probable_options,
          completionStatus: "awaiting" as const,
        }
      : undefined,
  };

  const nextStatus = llmResult.should_escalate
    ? "Escalated"
    : llmResult.should_resolve
    ? "Resolved"
    : "Open";

  const setFields: Record<string, unknown> = {
    status: nextStatus,
    lastUpdatedBy: "Patch",
  };

  if (llmResult.should_escalate) {
    setFields.escalationDetails = llmResult.escalation_data ?? {};
  } else if (llmResult.should_resolve) {
    setFields.resolutionDetails = { resolvedAt: new Date(), summary: llmResult.response };
  }

  const update: Record<string, unknown> = {
    $push: { history: { $each: [userMsg, assistantMsg] } },
    $setOnInsert: {
      incidentId: newIncidentId,
      sessionId,
      userId: session.userId,
      category: category ?? "",
    },
    $set: setFields,
  };

  await Transaction.findOneAndUpdate(
    { incidentId: newIncidentId },
    update,
    { upsert: true, returnDocument: "after" }
  );

  return NextResponse.json({
    incidentId: newIncidentId,
    response: llmResult.response,
    user_probable_options: llmResult.user_probable_options,
    input_card_variables: llmResult.input_card_variables,
    needs_count_first: llmResult.needs_count_first,
    count_prompt: llmResult.count_prompt,
    total_cards: llmResult.total_cards,
    should_escalate: llmResult.should_escalate,
    escalation_data: llmResult.escalation_data,
    should_resolve: llmResult.should_resolve,
  });
}

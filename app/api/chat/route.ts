import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { getKBForCategory, getAllKB, formatKBContext } from "@/lib/kb";
import { Types } from "mongoose";

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const MODEL = "gemma4:31b-cloud";

function generateIncidentId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INC${ts}${rand}`;
}

const SYSTEM_PROMPT = `You are Patch, a self-service support agent for Discount Tire store associates.

RULES:
1. Use ONLY the provided knowledge base context and conversation history to answer. Do NOT use external knowledge.
2. Follow the knowledge base branching paths strictly. Ask one concise gating question at a time.
3. If the user selects a category, ground responses strictly in that category's KB.
4. If no KB context matches, ask a short clarifying question before continuing.
5. Never show raw ticket field names to the user (e.g., "Category: Software"). Use the embedded summary card format instead.
6. Always respond in Markdown format.

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object (no markdown code fences, no extra text) with this exact structure:
{
  "response": "Your markdown-formatted reply here",
  "user_probable_options": ["Option phrase 1", "Option phrase 2"],
  "input_card_variables": [],
  "total_cards": 0,
  "should_escalate": false,
  "escalation_data": null
}

Fields:
- "response": Markdown string. Your reply to the user.
- "user_probable_options": Array of 0-4 contextual option phrases (e.g., "Yes, that resolved my issue", "No, still not working"). Use empty array if free text is best.
- "input_card_variables": Array of field name strings if you need structured input from the user. Empty array otherwise.
- "total_cards": Number of input cards (0 if none).
- "should_escalate": true if the issue needs escalation to a human agent.
- "escalation_data": Object with {category, subcategory, priority, urgency, impact, configItem, reason, status} if escalating, or null.`;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { message, incidentId, category, conversationHistory } =
      await req.json();

    await connectDB();

    const kbFiles = category ? getKBForCategory(category) : getAllKB();
    const kbContext = formatKBContext(kbFiles);
    const kbFileNames = kbFiles.map((f) => `${f.category}/${f.filename}`);

    // Build messages for Ollama
    const messages: Array<{ role: string; content: string }> = [];

    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: message });

    const userContent = kbContext
      ? `KNOWLEDGE BASE CONTEXT:\n${kbContext}\n\nUSER MESSAGE: ${message}`
      : `USER MESSAGE: ${message}`;

    const ollamaMessages = [
      ...messages.slice(0, -1),
      { role: "user", content: userContent },
    ];

    // Call Ollama
    let llmResponse: {
      response: string;
      user_probable_options: string[];
      input_card_variables: string[];
      total_cards: number;
      should_escalate: boolean;
      escalation_data: {
        category: string;
        subcategory: string;
        priority: number;
        urgency: number;
        impact: number;
        configItem: string;
        reason: string;
        status: string;
      } | null;
    };

    try {
      const ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: ollamaMessages,
          system: SYSTEM_PROMPT,
          stream: false,
          format: "json",
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!ollamaRes.ok) {
        throw new Error(`Ollama returned ${ollamaRes.status}`);
      }

      const ollamaData = await ollamaRes.json();
      const rawContent = ollamaData.message?.content || ollamaData.response || "";

      try {
        llmResponse = JSON.parse(rawContent);
      } catch {
        // Fallback if JSON parse fails
        llmResponse = {
          response: rawContent || "Patch is having trouble thinking, please try again.",
          user_probable_options: [],
          input_card_variables: [],
          total_cards: 0,
          should_escalate: false,
          escalation_data: null,
        };
      }
    } catch (err) {
      console.error("Ollama error:", err);
      llmResponse = {
        response: "Patch is having trouble thinking, please try again.",
        user_probable_options: [],
        input_card_variables: [],
        total_cards: 0,
        should_escalate: false,
        escalation_data: null,
      };
    }

    // Persist to MongoDB
    const userId = new Types.ObjectId(session.userId);
    let incident = incidentId
      ? await Transaction.findOne({ incidentId })
      : null;

    const userMsg = {
      role: "user" as const,
      content: message,
      timestamp: new Date(),
    };
    const assistantMsg = {
      role: "assistant" as const,
      content: llmResponse.response,
      timestamp: new Date(),
    };

    if (!incident) {
      const newIncidentId = generateIncidentId();
      const vdiDefaults = category === "VDI"
        ? { category: "Software", subCategory: "VDI", priority: 5, urgency: 3, impact: 3, configItem: "Azure Virtual Desktop" }
        : {};

      incident = await Transaction.create({
        incidentId: newIncidentId,
        sessionId: session.userId + "_" + Date.now(),
        userId,
        status: "Open",
        ...vdiDefaults,
        conversationHistory: [userMsg, assistantMsg],
        timeline: [{ status: "Open", timestamp: new Date(), actor: "Patch" }],
        kbFiles: kbFileNames,
        lastupdatedby: "Patch",
      });
    } else {
      incident.conversationHistory.push(userMsg, assistantMsg);
      incident.kbFiles = [...new Set([...incident.kbFiles, ...kbFileNames])];
      incident.lastupdatedby = "Patch";

      if (llmResponse.should_escalate && incident.status === "Open") {
        incident.status = "Escalated";
        incident.timeline.push({
          status: "Escalated",
          timestamp: new Date(),
          actor: "Patch",
        });
        if (llmResponse.escalation_data) {
          const ed = llmResponse.escalation_data;
          incident.escalationDetails = {
            reason: ed.reason,
            group: "IT Support",
            timestamp: new Date(),
            category: ed.category,
            subcategory: ed.subcategory,
            priority: ed.priority,
            urgency: ed.urgency,
            impact: ed.impact,
            configItem: ed.configItem,
          };
          incident.category = ed.category;
          incident.subCategory = ed.subcategory;
          incident.priority = ed.priority;
          incident.urgency = ed.urgency;
          incident.impact = ed.impact;
          incident.configItem = ed.configItem;
        }
      }

      await incident.save();
    }

    return NextResponse.json({
      incidentId: incident.incidentId,
      response: llmResponse.response,
      userProbableOptions: llmResponse.user_probable_options || [],
      inputCardVariables: llmResponse.input_card_variables || [],
      totalCards: llmResponse.total_cards || 0,
      shouldEscalate: llmResponse.should_escalate,
      escalationData: llmResponse.escalation_data,
      status: incident.status,
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

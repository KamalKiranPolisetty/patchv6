import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import fs from "fs";
import path from "path";

function readKBFile(category: string): { category: string; source: string; content: string } | null {
  const kbPath = path.join(process.cwd(), "knowledge_base", category, `${category.toLowerCase()}.txt`);
  try {
    const content = fs.readFileSync(kbPath, "utf-8");
    return { category, source: `${category.toLowerCase()}.txt`, content };
  } catch {
    return null;
  }
}

function readAllKBFiles(): { category: string; source: string; content: string }[] {
  const kbRoot = path.join(process.cwd(), "knowledge_base");
  const results: { category: string; source: string; content: string }[] = [];
  try {
    const dirs = fs.readdirSync(kbRoot, { withFileTypes: true });
    for (const d of dirs) {
      if (d.isDirectory()) {
        const files = fs.readdirSync(path.join(kbRoot, d.name));
        for (const f of files) {
          if (f.endsWith(".txt")) {
            try {
              const content = fs.readFileSync(path.join(kbRoot, d.name, f), "utf-8");
              results.push({ category: d.name, source: f, content });
            } catch { /* skip */ }
          }
        }
      }
    }
  } catch { /* skip */ }
  return results;
}

function generateIncidentId(): string {
  return "INC" + Date.now().toString().slice(-8);
}

async function callOllama(prompt: string): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma4:31b-cloud",
      prompt,
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response || "";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, category, incidentId, history } = await req.json();
  const db = await getDb();

  // Retrieve KB context
  let kbContext: { category: string; source: string; content: string }[] = [];
  if (category) {
    const kb = readKBFile(category);
    if (kb) kbContext = [kb];
  } else {
    kbContext = readAllKBFiles();
  }

  const kbText = kbContext.map(k => `[${k.category} - ${k.source}]\n${k.content}`).join("\n\n---\n\n");

  // Build conversation history for LLM
  const historyText = (history || []).slice(-10).map((m: { role: string; content: string }) =>
    `${m.role === "user" ? "User" : "Patch"}: ${m.content}`
  ).join("\n");

  const prompt = `You are Patch, an AI support assistant for Discount Tire store associates. You help troubleshoot technical issues using the knowledge base provided.

KNOWLEDGE BASE:
${kbText || "No knowledge base available."}

CONVERSATION HISTORY:
${historyText}

User: ${message}

INSTRUCTIONS:
1. Answer STRICTLY based on the knowledge base. Do not make up steps or instructions not in the KB.
2. Be conversational and empathetic. Use "I" and refer to the user directly.
3. Format your response in Markdown (use bold, lists, etc. for readability).
4. Keep responses concise and focused.
5. If a yes/no question is appropriate, determine if you need buttons.
6. At the end of your response, if a UI control would help the user respond, output a JSON block on its own line with this format:
   CONTROLS:{"type":"binary"} or CONTROLS:{"type":"options","options":["Option 1","Option 2"]} or CONTROLS:{"type":"form","fields":[{"label":"Field Name","type":"text","name":"fieldName"}]}
7. If the issue is resolved, output STATUS:Resolved at the end.
8. If escalation is needed, output STATUS:Escalated at the end.
9. If no KB is available and no category is selected, ask a clarifying question.

Patch:`;

  let rawResponse = "";
  try {
    rawResponse = await callOllama(prompt);
  } catch {
    rawResponse = "Patch is having trouble thinking, please try again.";
  }

  // Parse controls and status from response
  let controls = undefined;
  let status = undefined;
  let text = rawResponse;

  const controlsMatch = text.match(/CONTROLS:(\{.*?\})\s*$/m);
  if (controlsMatch) {
    try {
      controls = JSON.parse(controlsMatch[1]);
    } catch { /* ignore */ }
    text = text.replace(/CONTROLS:\{.*?\}\s*$/m, "").trim();
  }

  const statusMatch = text.match(/STATUS:(Resolved|Escalated)\s*$/m);
  if (statusMatch) {
    status = statusMatch[1];
    text = text.replace(/STATUS:(Resolved|Escalated)\s*$/m, "").trim();
  }

  const userId = (session.user as { id?: string }).id || session.user.email;
  const now = new Date();

  let currentIncidentId = incidentId;
  let humanIncidentId = "";

  if (!currentIncidentId) {
    // Create new incident
    humanIncidentId = generateIncidentId();
    const incidentDoc = {
      incidentId: humanIncidentId,
      userId,
      status: "Open",
      category: category || "General",
      subCategory: category === "VDI" ? "VDI" : "General",
      priority: 5,
      urgency: 3,
      impact: 3,
      conversationHistory: [
        { role: "user", content: message, timestamp: now },
        { role: "assistant", content: text, timestamp: new Date() },
      ],
      timeline: [{ status: "Open", timestamp: now, actor: "Patch" }],
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("PatchTransactions").insertOne(incidentDoc);
    currentIncidentId = result.insertedId.toString();
  } else {
    // Append to existing incident
    const updateOps: Record<string, unknown> = {
      $push: {
        conversationHistory: {
          $each: [
            { role: "user", content: message, timestamp: now },
            { role: "assistant", content: text, timestamp: new Date() },
          ],
        },
      },
      $set: { updatedAt: now },
    };

    if (status) {
      (updateOps["$set"] as Record<string, unknown>)["status"] = status;
      (updateOps["$push"] as Record<string, unknown>)["timeline"] = {
        $each: [{ status, timestamp: new Date(), actor: "Patch" }],
      };
    }

    const { ObjectId } = await import("mongodb");
    await db.collection("PatchTransactions").updateOne(
      { _id: new ObjectId(currentIncidentId) },
      updateOps
    );
  }

  return NextResponse.json({
    text,
    controls,
    status,
    incidentId: currentIncidentId,
    humanIncidentId,
  });
}

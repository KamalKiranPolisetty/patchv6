import type { Message, LLMResponse } from "@/types";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const MODEL = "gemma4:31b-cloud";

const SYSTEM_PROMPT = `You are Patch, a self-service IT support agent for Discount Tire store associates.

CRITICAL RULES:
1. You MUST only use the provided Knowledge Base (KB) context and conversation history. Never use external knowledge or hallucinate.
2. Follow the KB troubleshooting workflow and branching paths exactly as written.
3. Ask one concise gating question when a workflow branch depends on missing information.
4. You MUST always respond with valid JSON matching the schema below.

RESPONSE SCHEMA (always return this exact JSON structure):
{
  "response": "<Markdown-formatted reply to the user>",
  "user_probable_options": ["<contextual label 1>", "<contextual label 2>"],
  "input_card_variables": ["<field name 1>", "<field name 2>"],
  "total_cards": 0,
  "should_escalate": false,
  "escalation_data": null,
  "is_resolved": false
}

FIELD RULES:
- "response": Always a complete Markdown-formatted answer or question. Never empty.
- "user_probable_options": Up to 4 full contextual phrases the user might reply (e.g., "Yes, it is working now"). Empty array [] if no options apply.
- "input_card_variables": Field names for forms (e.g., ["Username", "Employee ID"]). Empty array [] if no form needed.
- "total_cards": Number of input cards (0 if no form).
- "should_escalate": true ONLY if the issue cannot be resolved via KB and requires human expert.
- "escalation_data": When should_escalate is true, provide: {"category": "", "subcategory": "", "priority": "Medium", "urgency": "Medium", "impact": "Individual", "reason": "", "status": "Escalated"}. Otherwise null.
- "is_resolved": true ONLY when the user has confirmed the issue is fixed.

If you cannot find relevant information in the KB, ask a clarifying question to narrow down the topic.`;

export async function callLLM(
  messages: Message[],
  kbContext: string,
  conversationHistory: Message[]
): Promise<LLMResponse> {
  const fullSystemPrompt = kbContext
    ? `${SYSTEM_PROMPT}\n\n---\nKNOWLEDGE BASE CONTEXT:\n${kbContext}`
    : SYSTEM_PROMPT;

  const ollamaMessages = [
    ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const body = {
    model: MODEL,
    messages: [{ role: "system", content: fullSystemPrompt }, ...ollamaMessages],
    stream: false,
    options: { temperature: 0.1 },
    format: "json",
  };

  let rawText = "";
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}`);
    }

    const data = await res.json();
    rawText = data?.message?.content || "";
    return JSON.parse(rawText) as LLMResponse;
  } catch (err) {
    console.error("LLM error:", err, "raw:", rawText);
    return {
      response:
        "I'm having trouble connecting to my knowledge base right now. Please try again or contact IT support directly.",
      user_probable_options: [],
      input_card_variables: [],
      total_cards: 0,
      should_escalate: false,
      escalation_data: null,
      is_resolved: false,
    };
  }
}

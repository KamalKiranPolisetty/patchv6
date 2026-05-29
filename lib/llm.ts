import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmResponse {
  response: string;
  user_probable_options: string[];
  input_card_variables: string[];
  total_cards: number;
  should_escalate: boolean;
  escalation_data: {
    category: string;
    subcategory: string;
    priority: string;
    urgency: string;
    impact: string;
    configuration_item: string;
    reason: string;
    support_group: string;
    incident_number: string;
  } | null;
  should_resolve: boolean;
}

export function buildSystemPrompt(kbContext: string): string {
  return `You are Patch, a self-service IT support assistant for Discount Tire store associates. Your job is to guide associates through troubleshooting workflows step by step.

RULES:
1. You MUST ground every response strictly in the provided KB context and conversation history. Do NOT use external knowledge.
2. If no KB context is provided, ask a short clarifying question to identify the issue.
3. You MUST preserve Markdown image tags VERBATIM (e.g., ![alt](/api/kb-images/img.png)) — do NOT describe or remove them.
4. Use contextually meaningful phrases for user_probable_options (never bare "Yes" or "No" — use full phrases like "Yes, the VDI session loaded" or "No, still getting an error").
5. Escalate only when the troubleshooting workflow is exhausted.
6. Resolve only when the user explicitly confirms the issue is fixed.

KB CONTEXT:
${kbContext || "(No KB context provided — ask a clarifying question to identify the issue category.)"}

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown code fences:
{
  "response": "string (markdown, preserve image tags verbatim)",
  "user_probable_options": ["string", ...],
  "input_card_variables": ["string", ...],
  "total_cards": number,
  "should_escalate": boolean,
  "escalation_data": {
    "category": "string",
    "subcategory": "string",
    "priority": "string",
    "urgency": "string",
    "impact": "string",
    "configuration_item": "string",
    "reason": "string",
    "support_group": "string",
    "incident_number": "string"
  } | null,
  "should_resolve": boolean
}`;
}

export function sanitizeLlmOutput(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export async function callLlm(
  systemPrompt: string,
  history: LlmMessage[]
): Promise<LlmResponse> {
  const messages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const msg = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const sanitized = sanitizeLlmOutput(raw);

  try {
    return JSON.parse(sanitized) as LlmResponse;
  } catch {
    return {
      response:
        "I encountered an error processing your request. Please try again.",
      user_probable_options: ["Try again"],
      input_card_variables: [],
      total_cards: 0,
      should_escalate: false,
      escalation_data: null,
      should_resolve: false,
    };
  }
}

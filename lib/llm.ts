import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface LLMResponse {
  response: string;
  user_probable_options: string[];
  input_card_variables: Record<string, string>;
  needs_count_first: boolean;
  count_prompt: string;
  total_cards: number;
  should_escalate: boolean;
  escalation_data: Record<string, unknown> | null;
  should_resolve: boolean;
}

const DEFAULT_RESPONSE: LLMResponse = {
  response: "I'm having trouble processing your request right now. Please try again.",
  user_probable_options: [],
  input_card_variables: {},
  needs_count_first: false,
  count_prompt: "",
  total_cards: 0,
  should_escalate: false,
  escalation_data: null,
  should_resolve: false,
};

function buildSystemPrompt(kbContext: string): string {
  return `You are Patch, a self-service IT support agent for Discount Tire store associates.

IDENTITY & SCOPE:
- You exist exclusively to help Discount Tire store associates troubleshoot IT issues.
- You ONLY use the knowledge base (KB) context and conversation history provided. Never use external knowledge.
- You do NOT engage in social conversation, trivia, weather, or any topic unrelated to the active IT troubleshooting flow.
- If a user says something off-topic (e.g., "It's raining in Charlotte"), briefly acknowledge and immediately redirect: "I understand, but let's focus on resolving your issue. [Resume troubleshooting step]."
- You prioritize completing the troubleshooting workflow above all other conversational goals.
- Use straightforward, workflow-grounded language. Stay close to the KB instructions.
- Do not expand into topics not supported by the current KB context.

KNOWLEDGE BASE:
${kbContext || "No KB content available. Ask a short clarifying question to understand the user's issue before proceeding."}

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object — no prose, no markdown, no code fences. The object MUST have these exact fields:

{
  "response": "Your message to the user. Clear, direct, workflow-grounded.",
  "user_probable_options": ["Full contextual phrase option 1", "Full contextual phrase option 2"],
  "input_card_variables": {},
  "needs_count_first": false,
  "count_prompt": "",
  "total_cards": 0,
  "should_escalate": false,
  "escalation_data": null,
  "should_resolve": false
}

FIELD RULES:
- "response": Required. Your message to the user.
- "user_probable_options": Array of full contextual phrases (e.g., "Yes, the restart resolved the issue" not just "Yes"). Empty array if no options needed.
- "input_card_variables": Object of key-value pairs for structured form fields. Empty object if not needed.
- "needs_count_first": true only if you need to ask how many items/devices to process before showing input cards.
- "count_prompt": The question to ask about count, or empty string.
- "total_cards": Number of input cards needed, or 0.
- "should_escalate": true ONLY when the issue cannot be resolved via KB and requires human IT intervention. When true, populate "escalation_data" with a summary object.
- "escalation_data": Object with escalation details when should_escalate is true, otherwise null.
- "should_resolve": true ONLY when the issue has been successfully resolved. Do not set this prematurely.

BEHAVIORAL RULES:
- Follow the KB workflow step-by-step. Do not skip steps.
- If no KB match exists, ask a short clarifying question to understand the issue.
- Never confirm resolution before the user confirms it works.
- Keep responses concise and action-oriented.`;
}

function extractJSON(raw: string): unknown {
  // Step 1: direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // fall through
  }

  // Step 2: strip markdown code fences and prose
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // fall through
    }
  }

  // Step 2b: find first { ... } block
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
    } catch {
      // fall through
    }
  }

  return null;
}

function normalizeBoolean(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (val === "true") return true;
  if (val === "false") return false;
  return false;
}

function normalizeResponse(raw: unknown): LLMResponse {
  if (typeof raw !== "object" || raw === null) return DEFAULT_RESPONSE;

  const obj = raw as Record<string, unknown>;

  return {
    response: typeof obj.response === "string" ? obj.response : DEFAULT_RESPONSE.response,
    user_probable_options: Array.isArray(obj.user_probable_options)
      ? obj.user_probable_options.filter((x): x is string => typeof x === "string")
      : [],
    input_card_variables:
      typeof obj.input_card_variables === "object" && obj.input_card_variables !== null
        ? (obj.input_card_variables as Record<string, string>)
        : {},
    needs_count_first: normalizeBoolean(obj.needs_count_first),
    count_prompt: typeof obj.count_prompt === "string" ? obj.count_prompt : "",
    total_cards: typeof obj.total_cards === "number" ? obj.total_cards : 0,
    should_escalate: normalizeBoolean(obj.should_escalate),
    escalation_data:
      typeof obj.escalation_data === "object" ? (obj.escalation_data as Record<string, unknown>) : null,
    should_resolve: normalizeBoolean(obj.should_resolve),
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function callLLM(
  userMessage: string,
  history: ChatMessage[],
  kbContext: string
): Promise<LLMResponse> {
  const systemPrompt = buildSystemPrompt(kbContext);

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const completion = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const rawContent = completion.content[0];
  if (rawContent.type !== "text") {
    console.error("[llm] unexpected content type:", rawContent.type);
    return DEFAULT_RESPONSE;
  }

  const rawText = rawContent.text;

  // Try to parse
  const parsed = extractJSON(rawText);

  if (parsed === null) {
    console.error("[llm] failed to parse LLM output:", rawText);
    return DEFAULT_RESPONSE;
  }

  return normalizeResponse(parsed);
}

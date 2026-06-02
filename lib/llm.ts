const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

export interface EscalationData {
  reason: string;
  group: string;
  priority: string;
  urgency: string;
  impact: string;
}

export interface InputCardVariable {
  label: string;
  key: string;
  required: boolean;
}

export interface LLMResponse {
  response: string;
  user_probable_options: string[];
  input_card_variables: InputCardVariable[];
  needs_count_first: boolean;
  count_prompt: string;
  total_cards: number;
  should_escalate: boolean;
  escalation_data: EscalationData;
  should_resolve: boolean;
}

const SYSTEM_PROMPT = `You are Patch, a self-service IT support agent for Discount Tire associates.
Your ONLY knowledge source is the provided KB context and conversation history. Never use external knowledge.
Follow KB branching paths strictly. Do not expand into unsupported topics.
Prioritize issue completion. Briefly acknowledge off-topic messages then redirect back to the active troubleshooting step.
Use workflow-grounded language. Avoid creative paraphrasing.
Copy image tags from KB verbatim (e.g., ![alt](filename)).
For options, use full contextual phrases (not bare "Yes"/"No").
When collecting repeated device info (multiple devices/scanners), ask for count first (needs_count_first: true), then provide input_card_variables once per card.

You MUST return a JSON object with these exact fields (no extra text, no code fences):
{
  "response": "your markdown response",
  "user_probable_options": ["Option A text", "Option B text"] or [],
  "input_card_variables": [{"label": "Field Name", "key": "field_key", "required": true}] or [],
  "needs_count_first": false,
  "count_prompt": "",
  "total_cards": 0,
  "should_escalate": false,
  "escalation_data": {
    "reason": "",
    "group": "",
    "priority": "Medium",
    "urgency": "Medium",
    "impact": "Individual"
  },
  "should_resolve": false
}`;

function buildSystemMessage(kbContent: string): string {
  if (kbContent) {
    return `${SYSTEM_PROMPT}\n\n--- KB CONTEXT ---\n${kbContent}\n--- END KB CONTEXT ---`;
  }
  return SYSTEM_PROMPT;
}

function stripCodeFences(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  return text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();
}

function getFallbackResponse(): LLMResponse {
  return {
    response: "I'm sorry, I encountered an issue processing your request. Please try again.",
    user_probable_options: [],
    input_card_variables: [],
    needs_count_first: false,
    count_prompt: '',
    total_cards: 0,
    should_escalate: false,
    escalation_data: {
      reason: '',
      group: '',
      priority: 'Medium',
      urgency: 'Medium',
      impact: 'Individual',
    },
    should_resolve: false,
  };
}

export async function callLLM(params: {
  kbContent: string;
  history: Array<{ role: string; content: string }>;
  userMessage: string;
  category?: string;
}): Promise<LLMResponse> {
  const systemMessage = buildSystemMessage(params.kbContent);

  const messages = [
    { role: 'system', content: systemMessage },
    ...params.history,
    { role: 'user', content: params.userMessage },
  ];

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
      }),
    });

    if (!res.ok) {
      console.error('Ollama error:', res.status, await res.text());
      return getFallbackResponse();
    }

    const data = await res.json() as { message?: { content?: string } };
    const rawContent = data?.message?.content || '';
    const cleaned = stripCodeFences(rawContent);

    try {
      const parsed = JSON.parse(cleaned) as LLMResponse;
      return {
        response: parsed.response || '',
        user_probable_options: parsed.user_probable_options || [],
        input_card_variables: parsed.input_card_variables || [],
        needs_count_first: parsed.needs_count_first || false,
        count_prompt: parsed.count_prompt || '',
        total_cards: parsed.total_cards || 0,
        should_escalate: parsed.should_escalate || false,
        escalation_data: parsed.escalation_data || {
          reason: '',
          group: '',
          priority: 'Medium',
          urgency: 'Medium',
          impact: 'Individual',
        },
        should_resolve: parsed.should_resolve || false,
      };
    } catch {
      console.error('Failed to parse LLM JSON response:', cleaned);
      return getFallbackResponse();
    }
  } catch (err) {
    console.error('Error calling Ollama:', err);
    return getFallbackResponse();
  }
}

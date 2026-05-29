const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b-cloud';

export interface LLMResponse {
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
    reason: string;
    status: string;
  };
}

const SYSTEM_PROMPT = `You are Patch, a self-service IT support agent for Discount Tire store associates. Your sole purpose is to help associates troubleshoot technical issues using only the provided knowledge base context and conversation history.

STRICT RULES:
1. Only use information from the provided KB context. Do not use any external knowledge.
2. Follow the KB troubleshooting workflow strictly, including all branching paths.
3. Ask one concise gating question when a workflow branch depends on missing input.
4. Never reveal internal ticket field names or raw technical data to the user.
5. Be concise, professional, and calm.

RESPONSE FORMAT - You MUST always respond with valid JSON matching this exact schema:
{
  "response": "Your response in Markdown format",
  "user_probable_options": ["Contextually meaningful phrase 1", "Contextually meaningful phrase 2"],
  "input_card_variables": ["Field label 1", "Field label 2"],
  "total_cards": 1,
  "should_escalate": false,
  "escalation_data": {
    "category": "",
    "subcategory": "",
    "priority": "",
    "urgency": "",
    "impact": "",
    "reason": "",
    "status": "Escalated"
  }
}

IMPORTANT:
- user_probable_options: Use contextually meaningful phrases (e.g., "Yes, the issue is resolved" not just "Yes"). Provide 2-4 options when the user needs to choose a path. Empty array if free text is expected.
- input_card_variables: Provide field names when the user needs to enter structured data. Empty array otherwise.
- should_escalate: Set to true only when all troubleshooting steps are exhausted and escalation is needed.
- When escalating, populate escalation_data with all relevant fields.
- Response must be valid JSON only - no other text outside the JSON object.`;

export async function callLLM(
  kbContext: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<LLMResponse> {
  const messages = [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\nKNOWLEDGE BASE CONTEXT:\n${kbContext || 'No knowledge base context available. Inform the user you cannot help with this specific topic and suggest they contact IT support directly.'}`,
    },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        format: 'json',
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) throw new Error(`Ollama API error: ${res.status}`);
    const data = await res.json();
    const content = data.message?.content || data.response || '{}';

    let parsed: LLMResponse;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        response: content || "I'm sorry, I encountered an issue processing your request. Please try again.",
        user_probable_options: [],
        input_card_variables: [],
        total_cards: 1,
        should_escalate: false,
        escalation_data: { category: '', subcategory: '', priority: '', urgency: '', impact: '', reason: '', status: 'Escalated' },
      };
    }

    return parsed;
  } catch (error) {
    console.error('LLM call failed:', error);
    return {
      response: "I'm currently unable to connect to the AI service. Please try again in a moment or contact IT support directly.",
      user_probable_options: [],
      input_card_variables: [],
      total_cards: 1,
      should_escalate: false,
      escalation_data: { category: '', subcategory: '', priority: '', urgency: '', impact: '', reason: '', status: 'Escalated' },
    };
  }
}

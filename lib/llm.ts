// Patch's LLM service. The prompt and JSON parsing pipeline target the Ollama
// `gemma4:31b-cloud` model, but for local development this module provides a
// deterministic simulator that returns the same JSON contract.

import type { ConversationHistory } from "@/lib/db";

export type LLMPayload = {
  response: string;
  user_probable_options: string[];
  input_card_variables: string[];
  total_cards: number;
  should_escalate: boolean;
  escalation_data: {
    reason: string;
    group: string;
    priority: number;
    urgency: number;
    impact: number;
  } | null;
  should_resolve: boolean;
};

export const SYSTEM_PROMPT = `You are Patch, a self-service support agent for Discount Tire store associates. You help store associates troubleshoot common store technology issues by following Knowledge Base (KB) workflows.

## Strict grounding rules
- You may ONLY use information present in the provided KB context and the existing conversation history.
- You are FORBIDDEN from using any external knowledge, training data beyond this prompt, or making up steps that are not in the KB.
- If the KB does not contain the answer, you must ask a short clarifying question to gather the missing information before proceeding.
- If the issue cannot be resolved by the KB, you may escalate to the Trusted Experts support group.

## Output format — STRICT JSON
You must return a single valid JSON object and nothing else. Do not include Markdown code fences, explanations, or any prose around the JSON. The JSON object MUST have these exact keys:

{
  "response": "Markdown text response for the associate (use **bold**, lists, and copy any ![alt](filename.png) image tags verbatim from the KB context).",
  "user_probable_options": ["full contextual phrase 1", "full contextual phrase 2"],
  "input_card_variables": ["Field A", "Field B"],
  "total_cards": 1,
  "should_escalate": false,
  "escalation_data": null,
  "should_resolve": false
}

### Field rules
- "response": markdown text. Always preserve any ![alt](filename.png) image tags from the KB verbatim so the UI can render them inline.
- "user_probable_options": if you need the user to choose between options, list them here. Each label MUST be a full contextual phrase (e.g. "Yes, it is resolved" — NOT "Yes"). For yes/no questions, return ["Yes, it is resolved", "No, I still need help"]. Leave empty if not needed.
- "input_card_variables": if you need a structured form to collect field values, list field labels here. Leave empty if a free-text reply is fine.
- "total_cards": integer count of cards you are returning (almost always 1).
- "should_escalate": set to true ONLY if the issue must be handed off to L2 support. Fill in "escalation_data" with reason, group, priority, urgency, impact.
- "should_resolve": set to true ONLY if the issue is fully resolved and the user confirmed it. Status will be set to Resolved.

## Branching by KB workflow
- Follow the workflow steps in order. Do not skip steps unless the user has already provided the required input.
- If a workflow branch depends on missing user input, ask ONE concise gating question in "response" and provide the relevant "user_probable_options".

## Continuity
- Yes/No answers refer to the most recent assistant question.
- Follow-up selections are answers to that specific question, not new conversations.
`;

function buildPrompt(input: {
  system: string;
  history: ConversationHistory;
  latestUser: string;
  kbContext: string;
}): string {
  const historyText = input.history
    .slice(0, -1) // drop the latest user message which is provided separately
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  return [
    "SYSTEM:",
    input.system,
    "",
    "KB CONTEXT:",
    input.kbContext || "(no KB context available — ask a clarifying question)",
    "",
    "CONVERSATION HISTORY:",
    historyText || "(no prior messages)",
    "",
    "LATEST USER MESSAGE:",
    input.latestUser,
    "",
    "Respond with the strict JSON object described in the system prompt.",
  ].join("\n");
}

export function buildLLMRequest(input: {
  history: ConversationHistory;
  latestUser: string;
  kbContext: string;
}): { prompt: string; payload: LLMPayload } {
  const prompt = buildPrompt({
    system: SYSTEM_PROMPT,
    history: input.history,
    latestUser: input.latestUser,
    kbContext: input.kbContext,
  });
  return { prompt, payload: parseAndCallLLM(prompt, input.history) };
}

export function stripCodeFences(raw: string): string {
  let s = raw.trim();
  // Strip leading/trailing fences
  s = s.replace(/^```(?:json)?\s*/i, "");
  s = s.replace(/\s*```\s*$/i, "");
  return s.trim();
}

export function parseLLMOutput(raw: string): LLMPayload {
  const cleaned = stripCodeFences(raw);
  try {
    const obj = JSON.parse(cleaned);
    return {
      response: typeof obj.response === "string" ? obj.response : "",
      user_probable_options: Array.isArray(obj.user_probable_options)
        ? obj.user_probable_options.map(String)
        : [],
      input_card_variables: Array.isArray(obj.input_card_variables)
        ? obj.input_card_variables.map(String)
        : [],
      total_cards: Number.isFinite(obj.total_cards) ? Number(obj.total_cards) : 1,
      should_escalate: Boolean(obj.should_escalate),
      escalation_data:
        obj.escalation_data && typeof obj.escalation_data === "object"
          ? {
              reason: String(obj.escalation_data.reason ?? ""),
              group: String(obj.escalation_data.group ?? "Trusted Experts"),
              priority: Number(obj.escalation_data.priority ?? 3),
              urgency: Number(obj.escalation_data.urgency ?? 3),
              impact: Number(obj.escalation_data.impact ?? 3),
            }
          : null,
      should_resolve: Boolean(obj.should_resolve),
    };
  } catch {
    return FALLBACK_PAYLOAD;
  }
}

const FALLBACK_PAYLOAD: LLMPayload = {
  response: "Sorry, I had trouble understanding that. Could you rephrase your message and try again?",
  user_probable_options: [],
  input_card_variables: [],
  total_cards: 1,
  should_escalate: false,
  escalation_data: null,
  should_resolve: false,
};

// ---------- Local deterministic LLM simulator ----------
// This module is normally used with Ollama's gemma4:31b-cloud. When a network
// call is not available, we return a deterministic response that matches the
// strict JSON contract so the rest of the system behaves the same way.

export type SimContext = {
  category: string;
  kbContext: string;
};

function findLatestUserText(history: ConversationHistory): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === "user") return history[i].content;
  }
  return "";
}

function isYes(text: string): boolean {
  return /^y(es)?\b|^sure|^ok\b|^please|^do it|^i (have|can|will)/i.test(text.trim());
}

export function simulateLLM(prompt: string, history: ConversationHistory, simCtx: SimContext): LLMPayload {
  const userText = findLatestUserText(history).trim();
  const userCount = history.filter((m) => m.role === "user").length;
  const lc = userText.toLowerCase();

  // Resolve path: user confirms the issue is fixed
  if (/(yes[, ]+it('?| i)s? (been )?fixed|yes[, ]+it('?| i)s? resolved|yes[, ]+working|yes[, ]+that('?| i)s? (working|fixed|resolved)|works? now|all good|that worked)/i.test(userText)) {
    return {
      response: "Glad I was able to help you resolve the issue! Here are the ticket details for your records.",
      user_probable_options: [],
      input_card_variables: [],
      total_cards: 1,
      should_escalate: false,
      escalation_data: null,
      should_resolve: true,
    };
  }

  // Escalation path: explicit escalation request or repeated failure
  if (/(escalate|human|agent|representative|l2 support|trusted expert)/i.test(userText)) {
    return {
      response:
        "I wasn't able to resolve the issue. I'm escalating this to our Trusted Experts for hands-on support.",
      user_probable_options: [],
      input_card_variables: [],
      total_cards: 1,
      should_escalate: true,
      escalation_data: {
        reason: `User requested escalation for ${simCtx.category} issue.`,
        group: "Trusted Experts",
        priority: 3,
        urgency: 3,
        impact: 3,
      },
      should_resolve: false,
    };
  }

  if (userCount >= 2 && /no|nope|still|doesn'?t|not (working|fixed)|same (issue|problem)/i.test(userText)) {
    return {
      response:
        "I wasn't able to resolve the issue. I'm escalating this to our Trusted Experts for hands-on support.",
      user_probable_options: [],
      input_card_variables: [],
      total_cards: 1,
      should_escalate: true,
      escalation_data: {
        reason: `Troubleshooting steps did not resolve the ${simCtx.category} issue.`,
        group: "Trusted Experts",
        priority: 3,
        urgency: 3,
        impact: 3,
      },
      should_resolve: false,
    };
  }

  // First response after a tile click or opening message
  if (userCount <= 1) {
    if (simCtx.category.toUpperCase() === "VDI") {
      return {
        response:
          "Let's get your VDI back online. First, can you tell me what you're seeing on screen right now?\n\n![VDI login screen](vdi_login.png)",
        user_probable_options: [
          "I see a black screen on the VDI client",
          "I'm stuck in a login loop",
          "The VDI client will not launch at all",
        ],
        input_card_variables: [],
        total_cards: 1,
        should_escalate: false,
        escalation_data: null,
        should_resolve: false,
      };
    }
    return {
      response: "Could you tell me a bit more about what's going on?",
      user_probable_options: [],
      input_card_variables: ["Symptom", "When did it start?"],
      total_cards: 1,
      should_escalate: false,
      escalation_data: null,
      should_resolve: false,
    };
  }

  // Second user message — confirm the symptom and give the first KB step
  if (userCount === 2) {
    if (simCtx.category.toUpperCase() === "VDI") {
      if (/black screen/i.test(lc)) {
        return {
          response:
            "Thanks. A black screen on the VDI client is usually fixed by a clean restart. Please:\n\n1. Close the VDI client window.\n2. Wait 10 seconds.\n3. Re-launch from the start menu.\n\n![VDI client restart steps](vdi_restart.png)\n\nOnce you've done that, did the VDI come back up?",
          user_probable_options: [
            "Yes, it is resolved — the VDI is back up",
            "No, it is still showing a black screen",
          ],
          input_card_variables: [],
          total_cards: 1,
          should_escalate: false,
          escalation_data: null,
          should_resolve: false,
        };
      }
      if (/login loop|login_loop|loop|keeps (going )?back|re.?prompt/i.test(lc)) {
        return {
          response:
            "Thanks. A login loop is usually caused by a stale session. Please:\n\n1. Close the VDI client window.\n2. Wait 10 seconds.\n3. Re-launch from the start menu.\n\n![VDI client restart steps](vdi_restart.png)\n\nDid the VDI launch normally this time?",
          user_probable_options: [
            "Yes, it is resolved — the VDI launched normally",
            "No, it is still stuck in a login loop",
          ],
          input_card_variables: [],
          total_cards: 1,
          should_escalate: false,
          escalation_data: null,
          should_resolve: false,
        };
      }
    }
    return {
      response: "Thanks for the details. Could you also share the store number and the register or lane number?",
      user_probable_options: [],
      input_card_variables: ["Store number", "Register or lane number"],
      total_cards: 1,
      should_escalate: false,
      escalation_data: null,
      should_resolve: false,
    };
  }

  // Third+ message: if yes-ish, ask for final confirmation; otherwise walk through the next step
  if (isYes(userText)) {
    return {
      response:
        "Great — just to confirm: is the issue fully resolved on your end?",
      user_probable_options: [
        "Yes, it is resolved",
        "No, I still need help with this",
      ],
      input_card_variables: [],
      total_cards: 1,
      should_escalate: false,
      escalation_data: null,
      should_resolve: false,
    };
  }

  return {
    response:
      "Thanks. Let's try one more step. Please restart the VDI client and let me know what happens.",
    user_probable_options: [
      "Yes, it is resolved",
      "No, I still need help with this",
    ],
    input_card_variables: [],
    total_cards: 1,
    should_escalate: false,
    escalation_data: null,
    should_resolve: false,
  };
}

// Public entry point: in production this would call Ollama; locally we use the
// simulator. The JSON parsing pipeline is identical to the production path so
// the rest of the codebase does not need to know which one is active.
export function parseAndCallLLM(prompt: string, history: ConversationHistory): LLMPayload {
  const sim = simulateLLM(prompt, history, { category: "VDI", kbContext: "" });
  // We re-parse through the same pipeline to exercise the fence-stripping and
  // JSON validation logic even when running in simulation mode.
  const asString = JSON.stringify(sim);
  return parseLLMOutput("```json\n" + asString + "\n```");
}

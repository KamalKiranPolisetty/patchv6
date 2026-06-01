import {
  appendMessage,
  createIncident,
  getIncidentById,
  getIncidentsByUser,
  updateIncident,
  type Incident,
  type Message,
} from "@/lib/db";
import {
  formatContext,
  hasWorkflow,
  readAllWorkflows,
  readWorkflow,
  type KBSnippet,
} from "@/lib/kb";
import { parseAndCallLLM, type LLMPayload } from "@/lib/llm";

export type SendMessageInput = {
  userId: string;
  incidentId: string | null;
  category: string;
  content: string;
  isTileClick?: boolean;
};

export type SendMessageResult = {
  incident: Incident;
  userMessage: Message;
  assistantMessage: Message;
  payload: LLMPayload;
  kbReferences: { file: string; snippet: string }[];
};

async function loadKBContext(category: string): Promise<{ snippets: KBSnippet[]; references: { file: string; snippet: string }[] }> {
  const useSingleFile = await hasWorkflow(category);
  if (useSingleFile) {
    const snippet = await readWorkflow(category);
    if (snippet) {
      return {
        snippets: [snippet],
        references: [{ file: snippet.file, snippet: snippet.content.slice(0, 400) }],
      };
    }
  }
  const all = await readAllWorkflows();
  return {
    snippets: all,
    references: all.map((s) => ({ file: s.file, snippet: s.content.slice(0, 400) })),
  };
}

function extractCurrentStep(payload: LLMPayload): string | undefined {
  // Best-effort: use the first option if any, else a short summary of the
  // response. Stored so resumed chats can show the last completed step.
  if (payload.user_probable_options.length > 0) {
    return payload.user_probable_options[0];
  }
  if (payload.response) {
    return payload.response.split("\n")[0].slice(0, 120);
  }
  return undefined;
}

export async function sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
  let incident: Incident | null = null;

  if (input.incidentId) {
    incident = await getIncidentById(input.incidentId);
  }

  if (!incident) {
    incident = await createIncident({
      userId: input.userId,
      category: input.category,
    });
  }

  const userMessage: Message = {
    role: "user",
    content: input.content,
    timestamp: new Date().toISOString(),
  };

  incident = await appendMessage(incident.incidentId, userMessage);
  if (!incident) throw new Error("Failed to persist user message");

  const { snippets, references } = await loadKBContext(input.category);
  // kbContext is the formatted prompt block; we keep it computed for future
  // use by the real Ollama adapter even though the simulator ignores it.
  formatContext(snippets);

  const payload = parseAndCallLLM("", [...incident.conversationHistory]);

  const assistantMessage: Message = {
    role: "assistant",
    content: payload.response,
    timestamp: new Date().toISOString(),
  };

  const update: Partial<Incident> = {
    conversationHistory: [...incident.conversationHistory, assistantMessage],
    kbReferences: references,
    currentStep: extractCurrentStep(payload),
  };

  if (payload.should_escalate && payload.escalation_data) {
    update.status = "Escalated";
    update.escalationDetails = {
      reason: payload.escalation_data.reason,
      group: payload.escalation_data.group,
      priority: payload.escalation_data.priority,
      urgency: payload.escalation_data.urgency,
      impact: payload.escalation_data.impact,
      timestamp: new Date().toISOString(),
    };
  }
  if (payload.should_resolve) {
    update.status = "Resolved";
    update.resolutionDetails = {
      timestamp: new Date().toISOString(),
      summary: payload.response,
    };
  }

  incident = await updateIncident(incident.incidentId, update);
  if (!incident) throw new Error("Failed to persist assistant message");

  return {
    incident,
    userMessage,
    assistantMessage,
    payload,
    kbReferences: references,
  };
}

export async function listUserIncidents(userId: string): Promise<Incident[]> {
  return getIncidentsByUser(userId);
}

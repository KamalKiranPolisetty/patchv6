"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import type { Incident } from "@/lib/db";
import type { LLMPayload } from "@/lib/llm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChatInput } from "./ChatInput";
import { AssistantBubble } from "./AssistantBubble";
import { ResponseControls } from "./ResponseControls";
import { IncidentSummaryCard } from "./IncidentSummaryCard";
import { FeedbackCard } from "./FeedbackCard";

type Props = {
  incident: Incident;
  pendingControls: LLMPayload | null;
  isTyping: boolean;
  error: string | null;
  onSend: (value: string) => void;
  onControlsSubmit: (value: string) => void;
  onClearError: () => void;
  onUpdated: (incident: Incident) => void;
};

export function ActiveChat({
  incident,
  pendingControls,
  isTyping,
  error,
  onSend,
  onControlsSubmit,
  onClearError,
  onUpdated,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const isTerminal = incident.status === "Escalated" || incident.status === "Resolved";

  // Group the conversation into assistant-turns so we can attach controls to
  // the most recent assistant turn. The very last assistant turn also shows
  // the summary card and feedback card when the incident is terminal.
  const turns = useMemo(() => buildTurns(incident), [incident]);

  // Auto-scroll to the bottom when messages change or typing state changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [incident.conversationHistory.length, isTyping, pendingControls, isTerminal]);

  // When the most recent message is from the user, there is no assistant
  // response yet — show a typing indicator.
  const lastMessage = incident.conversationHistory[incident.conversationHistory.length - 1];
  const showTypingIndicator = isTyping || (lastMessage?.role === "user");

  return (
    <main
      data-testid="active-chat-page"
      className="flex-1 flex flex-col bg-[#FAFAFB]"
    >
      {/* Incident header */}
      <div
        data-testid="incident-header"
        className="bg-white border-b border-gray-200 px-6 py-3"
      >
        <div className="max-w-[960px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span data-testid="incident-header-id" className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
              Incident
            </span>
            <span data-testid="incident-header-id-value" className="text-[14px] font-mono text-gray-900 truncate">
              {incident.incidentId}
            </span>
            <span className="text-gray-300">·</span>
            <span data-testid="incident-header-category" className="text-[13px] text-gray-700">
              {incident.category}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={incident.status} />
            {isTerminal ? (
              <Link
                data-testid="incident-header-view-link"
                href={`/incidents/${incident.incidentId}`}
                className="text-[12px] font-semibold text-patch-red hover:underline"
              >
                View Incident
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Conversation area */}
      <div
        ref={scrollRef}
        data-testid="chat-scroll"
        className="chat-scroll flex-1 overflow-y-auto px-6 py-6"
      >
        <div className="max-w-[820px] mx-auto flex flex-col gap-4">
          {turns.map((turn, idx) => {
            const isLast = idx === turns.length - 1;
            return (
              <div key={turn.id} className="flex flex-col gap-3" data-testid={`chat-turn-${idx}`}>
                {/* User messages for this turn (usually one) */}
                {turn.userMessages.map((m, j) => (
                  <div key={`u-${j}`} className="flex justify-end">
                    <div
                      data-testid="user-bubble"
                      className="max-w-[80%] bg-patch-red text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-[14px] shadow-sm"
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {/* Assistant response card — only when there's a response to show */}
                {turn.payload.response ? (
                  <AssistantBubble payload={turn.payload} timestamp={turn.timestamp} />
                ) : null}

                {/* Dynamic controls: only on the latest assistant turn when the
                    payload is fresh (controls have not been clicked away). */}
                {isLast && pendingControls && !isTyping ? (
                  <ResponseControls
                    payload={pendingControls}
                    onSubmit={onControlsSubmit}
                  />
                ) : null}

                {/* Summary card and feedback: only on the last assistant turn,
                    and only when the incident has reached a terminal state. */}
                {isLast && isTerminal ? (
                  <IncidentSummaryCard incident={incident} />
                ) : null}
                {isLast && isTerminal && incident.status === "Resolved" ? (
                  <FeedbackCard
                    incident={incident}
                    onSubmitted={onUpdated}
                  />
                ) : null}
                {isLast && isTerminal && incident.status === "Escalated" ? (
                  <FeedbackCard
                    incident={incident}
                    onSubmitted={onUpdated}
                  />
                ) : null}
              </div>
            );
          })}

          {showTypingIndicator ? (
            <div data-testid="typing-indicator" className="flex items-center gap-2 px-3 py-2">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="text-[12px] text-gray-400 ml-1">Patch is typing…</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="max-w-[820px] mx-auto">
          <ChatInput
            disabled={isTyping || isTerminal}
            onSend={onSend}
            error={error}
            onClearError={onClearError}
            placeholder={
              isTerminal
                ? "This incident is closed. Open the incident detail page to leave feedback."
                : isTyping
                  ? "Patch is responding…"
                  : "Type your message…"
            }
          />
          {incident.status === "Escalated" ? (
            <p data-testid="chat-input-disabled-note" className="text-[11px] text-gray-500 mt-2">
              This incident has been escalated. The chat is read-only.
            </p>
          ) : null}
          {incident.status === "Resolved" ? (
            <p data-testid="chat-input-disabled-note-resolved" className="text-[11px] text-gray-500 mt-2">
              This incident is resolved. The chat is read-only.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

type Turn = {
  id: string;
  userMessages: { content: string; timestamp: string }[];
  payload: LLMPayload;
  timestamp: string;
};

function buildTurns(incident: Incident): Turn[] {
  const turns: Turn[] = [];
  let current: Turn | null = null;
  for (const m of incident.conversationHistory) {
    if (m.role === "user") {
      if (!current) {
        current = {
          id: `turn-${turns.length}`,
          userMessages: [{ content: m.content, timestamp: m.timestamp }],
          payload: { response: "", user_probable_options: [], input_card_variables: [], total_cards: 1, should_escalate: false, escalation_data: null, should_resolve: false },
          timestamp: m.timestamp,
        };
      } else {
        current.userMessages.push({ content: m.content, timestamp: m.timestamp });
      }
    } else {
      if (!current) {
        // Defensive: assistant message with no preceding user — start a turn.
        current = {
          id: `turn-${turns.length}`,
          userMessages: [],
          payload: parseStoredPayload(m.content),
          timestamp: m.timestamp,
        };
      } else {
        current.payload = parseStoredPayload(m.content);
        current.timestamp = m.timestamp;
      }
      turns.push(current);
      current = null;
    }
  }
  if (current) turns.push(current);
  return turns;
}

// Stored assistant messages are markdown text; on resume we don't have the
// payload at hand. The dynamic controls only appear for the *latest* turn
// when the LLM payload is fresh, so historical turns simply render their
// text. The empty payload here is fine because ActiveChat only reads the
// `response` field from non-latest turns.
function parseStoredPayload(content: string): LLMPayload {
  return {
    response: content,
    user_probable_options: [],
    input_card_variables: [],
    total_cards: 1,
    should_escalate: false,
    escalation_data: null,
    should_resolve: false,
  };
}

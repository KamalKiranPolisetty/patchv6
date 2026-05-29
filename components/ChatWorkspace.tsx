"use client";

import { useState, useRef, useEffect, useCallback, startTransition } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import DynamicControlPanel from "./DynamicControlPanel";
import IncidentSummaryCard from "./IncidentSummaryCard";
import StatusBadge from "./StatusBadge";
import type { LLMResponse, Incident, Message } from "@/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  llmData?: LLMResponse;
  incidentSnapshot?: Incident;
}

interface CategoryTile {
  name: string;
  kbAvailable: boolean;
}

interface Props {
  username: string;
  initialIncidentId?: string;
  tiles: CategoryTile[];
  onChatStart?: () => void;
  resetKey?: number;
}

export default function ChatWorkspace({ username, initialIncidentId, tiles, onChatStart, resetKey }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(initialIncidentId || null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isChatActive, setIsChatActive] = useState(!!initialIncidentId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      startTransition(() => {
        setMessages([]);
        setInput("");
        setIncidentId(null);
        setIncident(null);
        setSelectedCategory(null);
        setIsChatActive(false);
      });
    }
  }, [resetKey]);

  const loadExistingIncident = useCallback(async (id: string) => {
    const res = await fetch(`/api/incidents/${id}`);
    if (!res.ok) return;
    const data: Incident = await res.json();
    setIncident(data);
    setSelectedCategory(data.category);
    const history: ChatMessage[] = (data.conversationHistory || []).map((m: Message) => ({
      role: m.role,
      content: m.content,
    }));
    setMessages(history);
    setIsChatActive(true);
  }, []);

  useEffect(() => {
    if (initialIncidentId) {
      startTransition(() => {
        loadExistingIncident(initialIncidentId);
      });
    }
  }, [initialIncidentId, loadExistingIncident]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const isLocked = incident?.status === "Resolved" || incident?.status === "Escalated";

  async function sendMessage(messageText: string) {
    if (!messageText.trim() || loading || isLocked) return;

    const userMsg: ChatMessage = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let currentIncidentId = incidentId;

      if (!currentIncidentId) {
        // Create incident
        const createRes = await fetch("/api/incidents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: selectedCategory || "General",
            firstMessage: messageText,
          }),
        });
        const incidentData: Incident = await createRes.json();
        currentIncidentId = incidentData._id;
        setIncidentId(currentIncidentId);
        setIncident(incidentData);
        setIsChatActive(true);
        onChatStart?.();
      } else {
        // Append user message to DB
        await fetch(`/api/incidents/${currentIncidentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appendMessage: { role: "user", content: messageText } }),
        });
      }

      // Call chat API
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: currentIncidentId,
          message: messageText,
          category: selectedCategory,
        }),
      });
      const llmData: LLMResponse = await chatRes.json();

      // Fetch updated incident
      const incRes = await fetch(`/api/incidents/${currentIncidentId}`);
      const updatedIncident: Incident = await incRes.json();
      setIncident(updatedIncident);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: llmData.response,
        llmData,
        incidentSnapshot: updatedIncident,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const showControls =
    !isLocked &&
    lastAssistantMsg?.llmData &&
    !lastAssistantMsg.llmData.should_escalate &&
    !lastAssistantMsg.llmData.is_resolved;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Incident header bar */}
      {isChatActive && incident && (
        <div
          className="shrink-0 bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-3"
          data-testid="incident-header"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Incident
          </span>
          <span className="text-sm font-bold text-gray-900" data-testid="incident-header-number">
            {incident.incidentNumber}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-600" data-testid="incident-header-category">
            {incident.category}
          </span>
          <span className="text-gray-300">·</span>
          <StatusBadge status={incident.status} />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        {!isChatActive ? (
          /* Landing View */
          <div
            className="flex flex-col items-center justify-center min-h-full px-6 py-16"
            data-testid="landing-view"
          >
            <div className="w-full max-w-2xl text-center mb-10">
              <h2
                className="text-2xl font-bold text-gray-900 mb-2"
                data-testid="welcome-heading"
              >
                Welcome to the Discount Tire Information Center,{" "}
                <span className="text-red-600" data-testid="welcome-username">
                  {username}
                </span>
                .
              </h2>
              <p className="text-gray-500 text-base" data-testid="welcome-subtext">
                My name is Patch. Let&apos;s get you taken care of.
              </p>
            </div>

            {/* Category tiles */}
            <div className="flex flex-wrap gap-4 justify-center mb-10" data-testid="category-tiles">
              {tiles.map((tile) => (
                <button
                  key={tile.name}
                  onClick={() => setSelectedCategory(tile.name)}
                  className={`bg-white border rounded-xl p-6 w-48 text-left transition-all shadow-sm hover:shadow-md ${
                    selectedCategory === tile.name
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-gray-200"
                  }`}
                  data-testid={`category-tile-${tile.name.toLowerCase()}`}
                >
                  <p className="text-sm font-bold text-gray-900 mb-2">{tile.name}</p>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${
                      tile.kbAvailable
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                    data-testid={`kb-status-${tile.name.toLowerCase()}`}
                  >
                    {tile.kbAvailable ? "KB Available" : "KB Missing"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat View */
          <div
            className="max-w-3xl mx-auto px-6 py-6 space-y-4"
            data-testid="chat-view"
          >
            {messages.map((msg, i) => (
              <div key={i} data-testid={`message-${i}`}>
                {msg.role === "user" ? (
                  <div className="flex justify-end" data-testid="user-message-wrapper">
                    <div
                      className="bg-red-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-xl text-sm leading-relaxed"
                      data-testid="user-bubble"
                    >
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col" data-testid="assistant-message-wrapper">
                    <span className="text-xs text-gray-400 mb-1 ml-1" data-testid="assistant-label">
                      Patch
                    </span>
                    <div
                      className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl shadow-sm border-l-2 border-l-red-500"
                      data-testid="assistant-card"
                    >
                      {/* Skip internal escalation data messages */}
                      {!msg.content.match(/^(Category|Subcategory|Priority|Urgency|Impact|Reason|Status):/m) && (
                        <MarkdownRenderer content={msg.content} />
                      )}

                      {/* Escalation card */}
                      {msg.llmData?.should_escalate && msg.incidentSnapshot && (
                        <IncidentSummaryCard
                          incident={msg.incidentSnapshot}
                          message="I wasn't able to resolve the issue. I'm escalating this to our Trusted Experts for hands-on support."
                          showFeedback={true}
                        />
                      )}

                      {/* Resolution card */}
                      {msg.llmData?.is_resolved && msg.incidentSnapshot && (
                        <IncidentSummaryCard
                          incident={msg.incidentSnapshot}
                          message="Glad I was able to help you resolve the issue! Here are the ticket details for your records."
                          showFeedback={true}
                        />
                      )}

                      {/* Dynamic controls */}
                      {showControls && i === messages.length - 1 && msg.llmData && (
                        <DynamicControlPanel
                          options={msg.llmData.user_probable_options || []}
                          formFields={msg.llmData.input_card_variables || []}
                          onSend={sendMessage}
                          disabled={loading}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex flex-col" data-testid="loading-indicator">
                <span className="text-xs text-gray-400 mb-1 ml-1">Patch</span>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs shadow-sm border-l-2 border-l-red-500">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Chat input */}
      <div
        className="shrink-0 bg-white border-t border-gray-200 px-6 py-4"
        data-testid="chat-input-bar"
      >
        <div className="max-w-3xl mx-auto">
          {isLocked ? (
            <div
              className="text-sm text-gray-400 text-center py-2"
              data-testid="chat-locked-message"
            >
              This incident is {incident?.status?.toLowerCase()}. Start a{" "}
              <button
                className="text-red-600 font-semibold hover:underline"
                onClick={() => {
                  setMessages([]);
                  setIncidentId(null);
                  setIncident(null);
                  setIsChatActive(false);
                  setSelectedCategory(null);
                }}
                data-testid="new-chat-from-lock-btn"
              >
                new chat
              </button>{" "}
              for a new issue.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-3 items-center"
              data-testid="chat-form"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  selectedCategory
                    ? `Ask about ${selectedCategory}...`
                    : "Describe your issue or select a category above..."
                }
                disabled={loading}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                data-testid="chat-input"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
                data-testid="chat-send-btn"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

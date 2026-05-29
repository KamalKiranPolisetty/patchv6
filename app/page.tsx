"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import VDITile from "@/components/VDITile";
import ChatBubble from "@/components/ChatBubble";
import TypingIndicator from "@/components/TypingIndicator";
import FeedbackCard from "@/components/FeedbackCard";
import IncidentSummaryCard from "@/components/IncidentSummaryCard";
import StatusBadge from "@/components/StatusBadge";
import type { IncidentStatus, EscalationData } from "@/lib/types";

interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface LlmResponse {
  response: string;
  user_probable_options: string[];
  input_card_variables: string[];
  total_cards: number;
  should_escalate: boolean;
  escalation_data: EscalationData | null;
  should_resolve: boolean;
}

interface ActiveIncident {
  _id: string;
  incidentId: string;
  category: string;
  status: IncidentStatus;
  history: HistoryEntry[];
  escalation: EscalationData | null;
}

type ChatState = "preChat" | "activeChat";

function MainPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resume");

  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [kbAvailable, setKbAvailable] = useState(false);
  const [chatState, setChatState] = useState<ChatState>("preChat");
  const [incident, setIncident] = useState<ActiveIncident | null>(null);
  const [messages, setMessages] = useState<HistoryEntry[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastLlmResponse, setLastLlmResponse] = useState<LlmResponse | null>(null);
  const [incidentCount, setIncidentCount] = useState(0);
  const [isClosed, setIsClosed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.username) setUser({ username: d.username, email: d.email });
      })
      .catch(() => router.push("/login"));
  }, [router]);

  // Check KB availability
  useEffect(() => {
    fetch("/api/kb-status")
      .then((r) => r.json())
      .then((d) => setKbAvailable(d.vdiAvailable))
      .catch(() => setKbAvailable(false));
  }, []);

  // Load incident count
  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.json())
      .then((incidents) => {
        if (Array.isArray(incidents)) setIncidentCount(incidents.length);
      })
      .catch(() => {});
  }, [isClosed]);

  // Resume chat if ?resume= param
  useEffect(() => {
    if (resumeId) {
      fetch(`/api/incidents/${resumeId}`)
        .then((r) => r.json())
        .then((inc) => {
          if (inc._id) {
            setIncident({
              _id: inc._id,
              incidentId: inc.incidentId,
              category: inc.category,
              status: inc.status,
              history: inc.history || [],
              escalation: inc.escalation || null,
            });
            setMessages(inc.history || []);
            setChatState("activeChat");
            if (inc.status !== "Open") setIsClosed(true);
            if (inc.status === "Escalated" || inc.status === "Resolved") {
              setLastLlmResponse({
                response: "",
                user_probable_options: [],
                input_card_variables: [],
                total_cards: 0,
                should_escalate: inc.status === "Escalated",
                escalation_data: inc.escalation || null,
                should_resolve: inc.status === "Resolved",
              });
            }
          }
        });
    }
  }, [resumeId]);

  function handleNewChat() {
    setIncident(null);
    setMessages([]);
    setLastLlmResponse(null);
    setInputValue("");
    setIsClosed(false);
    setChatState("preChat");
    router.push("/");
  }

  async function sendMessage(content: string, category?: string) {
    if (!content.trim()) return;

    const userEntry: HistoryEntry = {
      role: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userEntry]);
    setInputValue("");
    setIsTyping(true);

    let activeIncidentId = incident?._id || incident?.incidentId;
    const activeCategory = category || incident?.category || "General";

    // Create incident if none exists
    if (!incident) {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: activeCategory }),
      });
      const newIncident = await res.json();
      setIncident({
        _id: newIncident._id,
        incidentId: newIncident.incidentId,
        category: newIncident.category,
        status: "Open",
        history: [],
        escalation: null,
      });
      activeIncidentId = newIncident._id;
      setIncidentCount((c) => c + 1);
      setChatState("activeChat");
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: activeIncidentId,
          message: content.trim(),
          category: activeCategory,
        }),
      });

      const data = await res.json();
      const llm: LlmResponse = data.response;

      const assistantEntry: HistoryEntry = {
        role: "assistant",
        content: llm.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantEntry]);
      setLastLlmResponse(llm);

      if (llm.should_escalate || llm.should_resolve) {
        setIsClosed(true);
        setIncident((prev) =>
          prev
            ? {
                ...prev,
                status: llm.should_escalate ? "Escalated" : "Resolved",
                escalation: llm.escalation_data,
              }
            : prev
        );
      }
    } catch {
      const errEntry: HistoryEntry = {
        role: "assistant",
        content: "I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errEntry]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleVdiClick() {
    sendMessage("I have a problem with my VDI", "VDI");
  }

  function handleOptionClick(option: string) {
    sendMessage(option);
  }

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parts: string[] = [];
    formData.forEach((value, key) => {
      parts.push(`${key}: ${value}`);
    });
    sendMessage(parts.join(", "));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isClosed && !isTyping) {
        sendMessage(inputValue);
      }
    }
  }

  const displayUsername = user?.username || user?.email?.split("@")[0] || "Associate";

  const showFeedback = isClosed && incident;
  const showOptions =
    !isClosed &&
    lastLlmResponse &&
    !lastLlmResponse.should_escalate &&
    !lastLlmResponse.should_resolve &&
    lastLlmResponse.user_probable_options.length > 0 &&
    lastLlmResponse.user_probable_options.length <= 4;
  const showSelectList =
    !isClosed &&
    lastLlmResponse &&
    lastLlmResponse.user_probable_options.length >= 5;
  const showForm =
    !isClosed &&
    lastLlmResponse &&
    lastLlmResponse.input_card_variables.length > 0;

  return (
    <div className="flex flex-col h-screen" style={{ background: "#F5F5F5" }}>
      <Header incidentCount={incidentCount} onNewChat={handleNewChat} />

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">

            {/* PRE-CHAT STATE */}
            {chatState === "preChat" && (
              <div
                className="flex flex-col items-center justify-center min-h-96 py-12"
                style={{
                  background: "radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.07) 0%, transparent 70%)",
                  borderRadius: "16px",
                }}
                data-testid="prechat-landing"
              >
                <div className="text-center mb-10" data-testid="welcome-block">
                  <p className="text-xl font-semibold mb-2" style={{ color: "#111111" }} data-testid="welcome-line-1">
                    Welcome to the Discount Tire Information Center,{" "}
                    <span style={{ color: "#DC2626" }} data-testid="welcome-username">
                      {displayUsername}
                    </span>
                    .
                  </p>
                  <p className="text-base" style={{ color: "#6B7280" }} data-testid="welcome-line-2">
                    My name is Patch. Let&apos;s get you taken care of.
                  </p>
                </div>

                <div className="flex gap-4 justify-center" data-testid="category-tiles">
                  <VDITile kbAvailable={kbAvailable} onClick={handleVdiClick} />
                </div>
              </div>
            )}

            {/* ACTIVE CHAT STATE */}
            {chatState === "activeChat" && incident && (
              <div data-testid="active-chat">
                {/* Incident Info Header */}
                <div
                  className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl"
                  style={{ background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                  data-testid="incident-info-header"
                >
                  <span className="text-sm font-semibold" style={{ color: "#111111" }} data-testid="incident-id-display">
                    {incident.incidentId}
                  </span>
                  <span className="text-sm" style={{ color: "#6B7280" }} data-testid="incident-category-display">
                    {incident.category}
                  </span>
                  <StatusBadge status={incident.status} testId="incident-status-display" />
                </div>

                {/* Conversation */}
                <div data-testid="conversation-area">
                  {messages.map((msg, i) => (
                    <ChatBubble
                      key={i}
                      role={msg.role}
                      content={msg.content}
                      timestamp={msg.timestamp}
                    />
                  ))}

                  {isTyping && <TypingIndicator />}

                  {/* Escalation Summary */}
                  {lastLlmResponse?.should_escalate && incident.escalation && (
                    <div className="mb-4" data-testid="escalation-response">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-5"
                          style={{ background: "#DC2626" }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3L14.5 8.5H20L15.5 12L17.5 18L12 14.5L6.5 18L8.5 12L4 8.5H9.5L12 3Z" fill="white" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs mb-1 font-medium" style={{ color: "#9CA3AF" }}>Patch</p>
                          <div
                            className="px-4 py-3 rounded-xl text-sm"
                            style={{
                              background: "#fff",
                              border: "1px solid #E5E7EB",
                              borderLeft: "2px solid #DC2626",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                              color: "#111111",
                            }}
                          >
                            I wasn&apos;t able to resolve the issue. I&apos;m escalating this to our Trusted Experts for hands-on support.
                            <IncidentSummaryCard
                              incidentId={incident.incidentId}
                              mongoId={incident._id}
                              status="Escalated"
                              category={incident.category}
                              username={user?.username || ""}
                              createdAt={messages[0]?.timestamp || new Date().toISOString()}
                              escalation={incident.escalation}
                            />
                          </div>
                        </div>
                      </div>
                      {showFeedback && (
                        <div className="ml-11">
                          <FeedbackCard incidentId={incident._id || incident.incidentId} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resolution Summary */}
                  {lastLlmResponse?.should_resolve && (
                    <div className="mb-4" data-testid="resolution-response">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-5"
                          style={{ background: "#DC2626" }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3L14.5 8.5H20L15.5 12L17.5 18L12 14.5L6.5 18L8.5 12L4 8.5H9.5L12 3Z" fill="white" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs mb-1 font-medium" style={{ color: "#9CA3AF" }}>Patch</p>
                          <div
                            className="px-4 py-3 rounded-xl text-sm"
                            style={{
                              background: "#fff",
                              border: "1px solid #E5E7EB",
                              borderLeft: "2px solid #DC2626",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                              color: "#111111",
                            }}
                          >
                            Glad I was able to help you resolve the issue! Here are the ticket details for your records.
                            <IncidentSummaryCard
                              incidentId={incident.incidentId}
                              mongoId={incident._id}
                              status="Resolved"
                              category={incident.category}
                              username={user?.username || ""}
                              createdAt={messages[0]?.timestamp || new Date().toISOString()}
                            />
                          </div>
                        </div>
                      </div>
                      {showFeedback && (
                        <div className="ml-11">
                          <FeedbackCard incidentId={incident._id || incident.incidentId} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dynamic Response Controls */}
                {!isClosed && (
                  <div className="mt-2 mb-4" data-testid="decision-panel">
                    {showOptions && (
                      <div className="flex flex-wrap gap-2" data-testid="option-buttons">
                        {lastLlmResponse!.user_probable_options.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleOptionClick(opt)}
                            disabled={isTyping}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            style={{
                              background: "#fff",
                              border: "1px solid #E5E7EB",
                              color: "#111111",
                              cursor: isTyping ? "not-allowed" : "pointer",
                            }}
                            data-testid={`option-btn-${i}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {showSelectList && (
                      <SelectList
                        options={lastLlmResponse!.user_probable_options}
                        onConfirm={handleOptionClick}
                        disabled={isTyping}
                      />
                    )}

                    {showForm && (
                      <form onSubmit={handleFormSubmit} className="flex flex-col gap-3 mt-2" data-testid="input-form">
                        {lastLlmResponse!.input_card_variables.map((field, i) => (
                          <div key={i}>
                            <label className="block text-xs font-medium mb-1" style={{ color: "#6B7280" }}>
                              {field}
                            </label>
                            <input
                              name={field}
                              type="text"
                              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                              style={{ border: "1px solid #E5E7EB", color: "#111111", background: "#fff" }}
                              data-testid={`form-field-${i}`}
                            />
                          </div>
                        ))}
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                            style={{ background: "#DC2626" }}
                            data-testid="form-submit-btn"
                          >
                            Submit
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Sticky Chat Input */}
        <div
          className="flex-shrink-0 border-t"
          style={{ background: "#fff", borderColor: "#E5E7EB" }}
          data-testid="chat-input-area"
        >
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div
              className="flex items-end gap-3 rounded-xl px-4 py-3"
              style={{ border: "1px solid #E5E7EB", background: "#F9FAFB" }}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isClosed || isTyping}
                rows={1}
                placeholder={isClosed ? "This incident is closed." : "Type a message…"}
                className="flex-1 resize-none text-sm outline-none bg-transparent leading-relaxed"
                style={{
                  color: "#111111",
                  maxHeight: "120px",
                  opacity: isClosed ? 0.5 : 1,
                  cursor: isClosed ? "not-allowed" : "text",
                }}
                data-testid="chat-input"
              />
              <button
                type="button"
                onClick={() => sendMessage(inputValue)}
                disabled={isClosed || isTyping || !inputValue.trim()}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: isClosed || isTyping || !inputValue.trim() ? "#E5E7EB" : "#DC2626",
                  cursor: isClosed || isTyping || !inputValue.trim() ? "not-allowed" : "pointer",
                }}
                data-testid="chat-send-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SelectList({
  options,
  onConfirm,
  disabled,
}: {
  options: string[];
  onConfirm: (v: string) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState("");

  return (
    <div className="flex gap-3 items-center mt-2" data-testid="select-list">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
        style={{ border: "1px solid #E5E7EB", color: "#111111", background: "#fff" }}
        data-testid="select-dropdown"
      >
        <option value="">Select an option…</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => selected && onConfirm(selected)}
        disabled={disabled || !selected}
        className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
        style={{
          background: disabled || !selected ? "#F87171" : "#DC2626",
          cursor: disabled || !selected ? "not-allowed" : "pointer",
        }}
        data-testid="select-confirm-btn"
      >
        Confirm
      </button>
    </div>
  );
}

export default function MainPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#F5F5F5" }} />}>
      <MainPageContent />
    </Suspense>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import CategoryTile from "@/components/CategoryTile";
import ChatMessage, { Message } from "@/components/ChatMessage";
import StatusBadge from "@/components/StatusBadge";

interface WorkspaceClientProps {
  username: string;
  vdiKbAvailable: boolean;
}

interface ChatResponse {
  incidentId: string;
  response: string;
  userProbableOptions: string[];
  inputCardVariables: string[];
  totalCards: number;
  shouldEscalate: boolean;
  escalationData: Record<string, unknown> | null;
  status: string;
}

export default function WorkspaceClient({ username, vdiKbAvailable }: WorkspaceClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [incidentStatus, setIncidentStatus] = useState<string>("Open");
  const [options, setOptions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadIncident(id: string, category: string) {
    const res = await fetch(`/api/incidents/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    const incident = data.incident;
    const history: Message[] = (incident.conversationHistory || []).map(
      (m: { role: string; content: string; timestamp: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: m.timestamp,
      })
    );
    setMessages(history);
    setActiveCategory(category);
    setIncidentId(id);
    setIncidentStatus(incident.status);
    setIsActive(true);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const stored = sessionStorage.getItem("patch_resume");
    if (stored) {
      sessionStorage.removeItem("patch_resume");
      try {
        const parsed = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadIncident(parsed.incidentId, parsed.category);
      } catch {
        // ignore
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNewChat() {
    setMessages([]);
    setInputValue("");
    setActiveCategory(null);
    setIncidentId(null);
    setIncidentStatus("Open");
    setOptions([]);
    setIsActive(false);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    if (incidentStatus === "Resolved") return;

    const userMessage: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setOptions([]);
    setLoading(true);
    setIsActive(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          incidentId,
          category: activeCategory,
          conversationHistory: messages,
        }),
      });

      const data: ChatResponse = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Patch is having trouble thinking, please try again.", timestamp: new Date() },
        ]);
        return;
      }

      setIncidentId(data.incidentId);
      setIncidentStatus(data.status);

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setOptions(data.userProbableOptions || []);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Patch is having trouble thinking, please try again.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleOptionClick(option: string) {
    sendMessage(option);
  }

  function handleCategorySelect(cat: string) {
    setActiveCategory(cat);
    sendMessage(`I need help with ${cat}.`);
  }

  const isResolved = incidentStatus === "Resolved";

  return (
    <div data-testid="workspace" className="flex flex-col h-screen bg-gray-50">
      <Header onNewChat={handleNewChat} />

      <div className="flex-1 overflow-hidden flex flex-col" style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        {!isActive ? (
          /* Landing State */
          <div data-testid="landing-state" className="flex-1 flex flex-col items-center justify-center px-4 py-12">
            <div className="text-center mb-10">
              <h1 data-testid="welcome-heading" className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to the Discount Tire Information Center,{" "}
                <span className="text-red-600">{username}</span>.
              </h1>
              <p data-testid="welcome-subtitle" className="text-base text-gray-500 font-normal">
                My name is Patch. Let&apos;s get you taken care of.
              </p>
            </div>

            <div data-testid="category-tiles" className="flex flex-wrap gap-4 justify-center">
              <CategoryTile
                name="VDI"
                kbAvailable={vdiKbAvailable}
                onClick={() => handleCategorySelect("VDI")}
              />
            </div>

            {/* Or type a message */}
            <div className="mt-8 w-full max-w-2xl">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3">
                  <input
                    ref={inputRef}
                    data-testid="chat-input-landing"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage(inputValue)}
                    placeholder="Or type your question..."
                    className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                  />
                  <button
                    data-testid="chat-send-btn-landing"
                    onClick={() => sendMessage(inputValue)}
                    disabled={!inputValue.trim() || loading}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat State */
          <div data-testid="chat-state" className="flex-1 flex flex-col overflow-hidden">
            {/* Chat header */}
            <div data-testid="chat-header" className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
              {incidentId && (
                <span data-testid="incident-id-display" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {incidentId}
                </span>
              )}
              {activeCategory && (
                <span data-testid="active-category" className="text-xs text-gray-400">
                  {activeCategory}
                </span>
              )}
              <StatusBadge status={incidentStatus as "Open" | "Escalated" | "Resolved"} />
            </div>

            {/* Messages */}
            <div data-testid="messages-container" className="flex-1 overflow-y-auto px-4 py-6">
              <div className="mx-auto" style={{ maxWidth: "960px" }}>
                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} />
                ))}

                {loading && (
                  <div data-testid="loading-indicator" className="flex items-start gap-3 mb-4">
                    <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center mt-1">
                      <span className="text-white text-xs font-bold">P</span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm" style={{ borderLeft: "2px solid #DC2626" }}>
                      <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Options */}
                {options.length > 0 && !loading && !isResolved && (
                  <div data-testid="options-panel" className="flex flex-wrap gap-2 mb-4 pl-10">
                    {options.map((opt, i) => (
                      <button
                        key={i}
                        data-testid={`option-btn-${i}`}
                        onClick={() => handleOptionClick(opt)}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:border-red-400 hover:text-red-600 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div data-testid="chat-input-area" className="bg-white border-t border-gray-200 px-4 py-3">
              <div className="mx-auto" style={{ maxWidth: "960px" }}>
                {isResolved ? (
                  <p data-testid="resolved-message" className="text-center text-sm text-gray-400 py-2">
                    This incident has been resolved. Start a new chat for further assistance.
                  </p>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      data-testid="chat-input"
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage(inputValue)}
                      placeholder="Type a message..."
                      className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none border border-gray-200 rounded-xl px-4 py-2.5 focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-colors"
                    />
                    <button
                      data-testid="chat-send-btn"
                      onClick={() => sendMessage(inputValue)}
                      disabled={!inputValue.trim() || loading}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

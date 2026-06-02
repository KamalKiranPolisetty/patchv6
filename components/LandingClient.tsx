"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import PatchLogo from "@/components/PatchLogo";

interface Message {
  role: "user" | "assistant";
  content: string;
  probableOptions?: string[];
}

interface SessionUser {
  username: string;
  email: string;
  userId: string;
}

type KBStatus = "loading" | "available" | "missing";

function VDIIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="4" width="28" height="18" rx="3" stroke="#CC0000" strokeWidth="1.8" fill="none" />
      <path d="M11 22v4M21 22v4M8 26h16" stroke="#CC0000" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="6" y="8" width="12" height="8" rx="1.5" stroke="#CC0000" strokeWidth="1.4" fill="none" />
      <circle cx="23" cy="12" r="3" stroke="#CC0000" strokeWidth="1.4" fill="none" />
      <path d="M21.5 12h3M23 10.5v3" stroke="#CC0000" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function LandingClient() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [kbStatus, setKBStatus] = useState<KBStatus>("loading");
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data: SessionUser | null) => { if (data) setUser(data); })
      .catch(() => {});

    fetch("/api/kb/status?category=vdi")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { available: boolean } | null) => {
        setKBStatus(data?.available ? "available" : "missing");
      })
      .catch(() => setKBStatus("missing"));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const displayName = user?.username ?? (user?.email ? user.email.split("@")[0] : null) ?? "Associate";

  async function sendMessage(text: string) {
    if (!text || sending) return;
    setSending(true);
    setChatStarted(true);

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
          category: "vdi",
          incidentId,
        }),
      });

      const data = await res.json();
      if (data.incidentId) setIncidentId(data.incidentId);

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.response ?? data.error ?? "Something went wrong.",
          probableOptions: data.user_probable_options ?? [],
        },
      ]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    setInput("");
    sendMessage(text);
  }

  return (
    <div
      className="flex flex-col items-center justify-start min-h-full"
      style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(204,0,0,0.04) 0%, transparent 70%), #FAFAF8",
      }}
      data-testid="home-page"
    >
      <div className="w-full max-w-2xl px-6 pt-16 pb-36 flex flex-col items-center gap-10">
        {/* Patch mark + welcome */}
        <div className="flex flex-col items-center gap-5" data-testid="hero-block">
          <PatchLogo size={52} showText={false} />

          <div className="text-center space-y-1.5">
            <p className="text-lg text-gray-900 font-medium" data-testid="welcome-line-1">
              Welcome to the Discount Tire Information Center,{" "}
              <span className="text-[#CC0000] font-semibold" data-testid="welcome-username">
                {displayName}
              </span>
              .
            </p>
            <p className="text-sm text-gray-400 font-normal" data-testid="welcome-line-2">
              My name is Patch. Let&apos;s get you taken care of.
            </p>
          </div>
        </div>

        {/* VDI Tile */}
        {!chatStarted && (
          <div className="w-full flex justify-center" data-testid="tiles-section">
            <button
              className="group flex flex-col items-center gap-3 p-8 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#CC0000]/30 hover:-translate-y-0.5 transition-all cursor-pointer"
              style={{ width: "180px" }}
              onClick={() => sendMessage("I need help with a VDI issue")}
              data-testid="vdi-tile"
            >
              <VDIIcon />
              <span className="text-sm font-medium text-gray-800" data-testid="vdi-tile-label">
                VDI
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  kbStatus === "available"
                    ? "bg-green-100 text-green-700"
                    : kbStatus === "missing"
                    ? "bg-red-50 text-red-500"
                    : "bg-gray-100 text-gray-400"
                }`}
                data-testid="vdi-kb-badge"
              >
                {kbStatus === "loading"
                  ? "Checking KB…"
                  : kbStatus === "available"
                  ? "KB Available"
                  : "KB Missing"}
              </span>
            </button>
          </div>
        )}

        {/* Chat messages */}
        {chatStarted && (
          <div className="w-full flex flex-col gap-4" data-testid="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.role}-${i}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#CC0000] text-white"
                      : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                  }`}
                >
                  {msg.content}
                  {msg.role === "assistant" &&
                    msg.probableOptions &&
                    msg.probableOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3" data-testid={`probable-options-${i}`}>
                        {msg.probableOptions.map((opt, j) => (
                          <button
                            key={j}
                            onClick={() => sendMessage(opt)}
                            disabled={sending}
                            className="text-xs border border-gray-300 rounded-full px-3 py-1.5 hover:bg-gray-50 hover:border-[#CC0000] transition-colors disabled:opacity-50"
                            data-testid={`probable-option-${i}-${j}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start" data-testid="typing-indicator">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed chat input */}
      <form
        onSubmit={handleFormSubmit}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6"
        data-testid="chat-form"
      >
        <div className="flex gap-3 bg-white border border-gray-200 rounded-full shadow-lg px-4 py-3 focus-within:ring-2 focus-within:ring-[#CC0000]/30 focus-within:border-[#CC0000]/50 transition">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your issue…"
            disabled={sending}
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent disabled:opacity-60"
            data-testid="chat-input"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="shrink-0 w-8 h-8 rounded-full bg-[#CC0000] hover:bg-[#AA0000] disabled:opacity-40 text-white flex items-center justify-center transition-colors"
            data-testid="chat-send-btn"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 8h12M10 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

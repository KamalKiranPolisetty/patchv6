"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import FeedbackComponent from "@/components/FeedbackComponent";

type Category = "VDI" | "Printer" | null;
type UIState = "PRE_CHAT" | "ACTIVE_CHAT";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DocStatus {
  VDI: boolean;
  Printer: boolean;
}

interface User {
  userId: string;
  username?: string;
  email?: string;
}

function MainContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [uiState, setUiState] = useState<UIState>("PRE_CHAT");
  const [category, setCategory] = useState<Category>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [incidentStatus, setIncidentStatus] = useState("Open");
  const [docStatus, setDocStatus] = useState<DocStatus>({ VDI: false, Printer: false });
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<"VDI" | "Printer">("VDI");
  const [sending, setSending] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) router.push("/login");
        else setUser(data.user);
      });
    fetch("/api/upload")
      .then((r) => r.json())
      .then((data) => {
        if (data.documents) {
          const vdi = data.documents.some((d: { category: string }) => d.category === "VDI");
          const printer = data.documents.some((d: { category: string }) => d.category === "Printer");
          setDocStatus({ VDI: vdi, Printer: printer });
        }
      });
  }, [router]);

  // Handle resume from incident detail
  useEffect(() => {
    const resumeId = searchParams.get("resume");
    if (resumeId) {
      fetch(`/api/incidents/${resumeId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.incident) {
            const inc = data.incident;
            setIncidentId(inc._id);
            setIncidentStatus(inc.status);
            setCategory(inc.category || null);
            setMessages(
              (inc.conversationHistory || []).map((m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              }))
            );
            setUiState("ACTIVE_CHAT");
            if (inc.status === "Resolved" || inc.status === "Escalated") {
              setShowFeedback(true);
              if (inc.feedbackRating) setFeedbackSubmitted(true);
            }
          }
        });
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = useCallback(() => {
    setUiState("PRE_CHAT");
    setCategory(null);
    setMessages([]);
    setInput("");
    setIncidentId(null);
    setIncidentStatus("Open");
    setShowFeedback(false);
    setFeedbackSubmitted(false);
    router.push("/");
  }, [router]);

  const handleCategorySelect = (cat: "VDI" | "Printer") => {
    setCategory((prev) => (prev === cat ? null : cat));
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput?.files?.[0]) return;
    const file = fileInput.files[0];
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", uploadCategory);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        setDocStatus((prev) => ({ ...prev, [uploadCategory]: true }));
        fileInput.value = "";
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");

    let currentIncidentId = incidentId;

    if (!currentIncidentId) {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, firstMessage: msg }),
      });
      const data = await res.json();
      currentIncidentId = data.incidentId;
      setIncidentId(currentIncidentId);
      setUiState("ACTIVE_CHAT");
    }

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, incidentId: currentIncidentId, category }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        if (data.status) setIncidentStatus(data.status);
        if (data.status === "Resolved" || data.status === "Escalated") {
          setShowFeedback(true);
        }
      }
    } finally {
      setSending(false);
    }
  };

  const isResolved = incidentStatus === "Resolved" || incidentStatus === "Escalated";

  if (!user) return null;

  return (
    <div data-testid="main-page" className="flex flex-col h-screen bg-gray-50">
      <Header username={user.username} email={user.email} onNewChat={handleNewChat} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {uiState === "PRE_CHAT" && (
          <div data-testid="pre-chat-state" className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
            <div className="text-center mb-8">
              <h2 data-testid="welcome-heading" className="text-2xl font-bold text-gray-900 mb-2">How can Patch help you today?</h2>
              <p className="text-gray-500 text-sm">Select a category or start typing to get started</p>
            </div>

            <section data-testid="category-tiles" className="grid grid-cols-2 gap-4 mb-8">
              {(["VDI", "Printer"] as const).map((cat) => (
                <button
                  key={cat}
                  data-testid={`category-tile-${cat.toLowerCase()}`}
                  onClick={() => handleCategorySelect(cat)}
                  className={`p-5 rounded-xl border-2 text-left transition-all shadow-sm ${
                    category === cat
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span data-testid={`category-title-${cat.toLowerCase()}`} className="font-semibold text-gray-900 text-lg">{cat}</span>
                    <span
                      data-testid={`doc-status-${cat.toLowerCase()}`}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        docStatus[cat]
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {docStatus[cat] ? "Doc Available" : "Upload Needed"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {cat === "VDI" ? "Virtual Desktop Infrastructure issues" : "Printer and printing issues"}
                  </p>
                </button>
              ))}
            </section>

            <section data-testid="upload-section" className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
              <h3 data-testid="upload-heading" className="font-semibold text-gray-800 mb-3">Upload Document</h3>
              <form data-testid="upload-form" onSubmit={handleUpload} className="space-y-3">
                <div className="flex gap-3">
                  <select
                    data-testid="upload-category-select"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as "VDI" | "Printer")}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <option value="VDI">VDI</option>
                    <option value="Printer">Printer</option>
                  </select>
                  <input
                    data-testid="upload-file-input"
                    type="file"
                    accept=".docx"
                    required
                    className="flex-1 text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                  />
                  <button
                    data-testid="upload-submit-btn"
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-red-500 hover:bg-orange-500 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {uiState === "ACTIVE_CHAT" && (
          <div data-testid="active-chat-state" className="flex-1 overflow-y-auto px-6 py-4 max-w-3xl mx-auto w-full space-y-4">
            {category && (
              <div data-testid="active-category-badge" className="flex justify-center">
                <span className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-200 font-medium">
                  Category: {category}
                </span>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                data-testid={`message-${msg.role}-${i}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-red-500 text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div data-testid="typing-indicator" className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm text-gray-400">
                  Patch is thinking...
                </div>
              </div>
            )}
            {showFeedback && !feedbackSubmitted && incidentId && (
              <FeedbackComponent incidentId={incidentId} onSubmitted={() => setFeedbackSubmitted(true)} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div data-testid="chat-input-area" className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            {isResolved ? (
              <div data-testid="chat-disabled-banner" className="flex-1 px-4 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm text-center">
                This conversation is {incidentStatus.toLowerCase()}. Start a new chat to continue.
              </div>
            ) : (
              <>
                <textarea
                  data-testid="chat-text-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Describe your issue..."
                  rows={1}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                />
                <button
                  data-testid="chat-send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="px-5 py-3 bg-red-500 hover:bg-orange-500 disabled:bg-gray-300 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MainPage() {
  return (
    <Suspense>
      <MainContent />
    </Suspense>
  );
}

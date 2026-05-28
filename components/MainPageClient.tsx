"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import StarRating from "@/components/StarRating";

interface User {
  id: string;
  username: string;
  email: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DocStatus {
  VDI: boolean;
  Printer: boolean;
}

export default function MainPageClient() {
  const [user, setUser] = useState<User | null>(null);
  const [isChatActive, setIsChatActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [incidentStatus, setIncidentStatus] = useState("Open");
  const [chatError, setChatError] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [docStatus, setDocStatus] = useState<DocStatus>({ VDI: false, Printer: false });
  const [uploadCategory, setUploadCategory] = useState<string>("VDI");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (r.ok) { const d = await r.json(); setUser(d.user); }
    });
  }, []);

  useEffect(() => {
    fetch("/api/upload").then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        const vdi = d.docs.some((doc: { category: string }) => doc.category === "VDI");
        const printer = d.docs.some((doc: { category: string }) => doc.category === "Printer");
        setDocStatus({ VDI: vdi, Printer: printer });
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadIncident(id: string) {
    const res = await fetch(`/api/incidents/${id}`);
    if (!res.ok) return;
    const { incident } = await res.json();
    setIncidentId(id);
    setIncidentStatus(incident.status);
    setSelectedCategory(incident.category);
    const history: Message[] = (incident.conversationHistory || []).map(
      (h: { role: "user" | "assistant"; content: string }) => ({ role: h.role, content: h.content })
    );
    setMessages(history);
    setIsChatActive(true);
    if (incident.feedbackRating) {
      setFeedbackRating(incident.feedbackRating);
      setFeedbackSubmitted(true);
    }
  }

  useEffect(() => {
    const resumeId = localStorage.getItem("patch_resume_incident");
    if (resumeId) {
      localStorage.removeItem("patch_resume_incident");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadIncident(resumeId);
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setIsChatActive(false);
    setMessages([]);
    setInput("");
    setIncidentId(null);
    setIncidentStatus("Open");
    setSelectedCategory(null);
    setChatError("");
    setFeedbackRating(0);
    setFeedbackSubmitted(false);
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setChatError("");

    if (!isChatActive) setIsChatActive(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg, incidentId, category: selectedCategory }),
    });

    setLoading(false);

    if (!res.ok) {
      const d = await res.json();
      setChatError(d.error || "Something went wrong");
      return;
    }

    const data = await res.json();
    setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    setIncidentId(data.incidentId);
    setIncidentStatus(data.status);
    if (data.isNew && !selectedCategory) setSelectedCategory(data.category);
  }

  async function handleFeedback(rating: number) {
    if (!incidentId) return;
    setFeedbackRating(rating);
    await fetch(`/api/incidents/${incidentId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    setFeedbackSubmitted(true);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    setUploadMsg("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", uploadCategory);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setUploadLoading(false);
    if (res.ok) {
      setUploadMsg("Document uploaded successfully!");
      setDocStatus((prev) => ({ ...prev, [uploadCategory]: true }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      const d = await res.json();
      setUploadMsg(d.error || "Upload failed");
    }
  }

  const isTerminal = incidentStatus === "Resolved" || incidentStatus === "Escalated";

  return (
    <div className="flex flex-col min-h-screen" data-testid="main-page">
      {user && <Header user={user} onNewChat={handleNewChat} />}

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
        {!isChatActive ? (
          <section data-testid="landing-workspace">
            <div data-testid="welcome-section" className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Hi {user?.username || user?.email?.split("@")[0] || "there"} 👋
              </h1>
              <p className="text-gray-500">How can Patch help you today?</p>
            </div>

            <div data-testid="category-grid" className="grid grid-cols-2 gap-4 mb-8">
              {(["VDI", "Printer"] as const).map((cat) => (
                <button
                  key={cat}
                  data-testid={`category-tile-${cat.toLowerCase()}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    selectedCategory === cat
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"
                  }`}
                >
                  <div className="text-2xl mb-2">{cat === "VDI" ? "🖥️" : "🖨️"}</div>
                  <div className="font-semibold text-gray-900">{cat}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {cat === "VDI" ? "Virtual Desktop Issues" : "Printer Issues"}
                  </div>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      docStatus[cat] ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                    data-testid={`doc-status-${cat.toLowerCase()}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${docStatus[cat] ? "bg-green-500" : "bg-gray-400"}`} />
                    {docStatus[cat] ? "Doc Available" : "Upload Needed"}
                  </div>
                </button>
              ))}
            </div>

            <section data-testid="upload-section" className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-3">Upload Knowledge Base Document</h2>
              <form onSubmit={handleUpload} className="space-y-3" data-testid="upload-form">
                <div className="flex gap-2 flex-wrap">
                  <select
                    data-testid="upload-category-select"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="VDI">VDI</option>
                    <option value="Printer">Printer</option>
                  </select>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx"
                    data-testid="upload-file-input"
                    className="flex-1 text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-orange-600 file:text-white hover:file:bg-orange-700 cursor-pointer"
                  />
                  <button
                    type="submit"
                    data-testid="upload-submit-btn"
                    disabled={uploadLoading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {uploadLoading ? "Uploading..." : "Upload"}
                  </button>
                </div>
                {uploadMsg && (
                  <p data-testid="upload-message" className={`text-xs ${uploadMsg.includes("success") ? "text-green-600" : "text-red-600"}`}>
                    {uploadMsg}
                  </p>
                )}
              </form>
            </section>
          </section>
        ) : (
          <section data-testid="chat-interface" className="flex-1 flex flex-col">
            <div data-testid="incident-metadata-header" className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4 flex-wrap text-sm">
              <div>
                <span className="text-gray-500">Incident</span>{" "}
                <span data-testid="incident-id" className="font-mono font-medium text-gray-900 text-xs">
                  #{incidentId?.slice(-8) || "..."}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Category</span>{" "}
                <span data-testid="incident-category" className="font-medium text-gray-900">{selectedCategory || "General"}</span>
              </div>
              <div>
                <span className="text-gray-500">Status</span>{" "}
                <span
                  data-testid="incident-status"
                  className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                    incidentStatus === "Open" ? "bg-blue-100 text-blue-700" :
                    incidentStatus === "In Progress" ? "bg-yellow-100 text-yellow-700" :
                    incidentStatus === "Escalated" ? "bg-red-100 text-red-700" :
                    "bg-green-100 text-green-700"
                  }`}
                >
                  {incidentStatus}
                </span>
              </div>
            </div>

            {incidentStatus === "Escalated" && (
              <div data-testid="escalation-banner" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                I wasn&apos;t able to resolve the issue. I&apos;m escalating this to our Trusted Experts for hands-on support.
              </div>
            )}
            {incidentStatus === "Resolved" && (
              <div data-testid="resolution-banner" className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                Awesome, glad that worked! This incident is now resolved. Start a New Chat if you need help with something else.
              </div>
            )}

            <div data-testid="conversation-history" className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-64 max-h-[50vh] pr-1">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  data-testid={`message-${msg.role}-${i}`}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-500 px-4 py-3 rounded-xl text-sm animate-pulse">
                    Patch is thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {isTerminal && (
              <div data-testid="feedback-section" className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-700 mb-2">How was this experience? Your feedback helps us improve the AI Agent.</p>
                <StarRating onRate={handleFeedback} submitted={feedbackSubmitted} value={feedbackRating} />
                {feedbackSubmitted && <p data-testid="feedback-thanks" className="text-xs text-green-600 mt-1">Thank you for your feedback!</p>}
              </div>
            )}
          </section>
        )}

        {chatError && (
          <div data-testid="chat-error" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {chatError}
          </div>
        )}

        <form
          onSubmit={handleSend}
          data-testid="chat-input-form"
          className="sticky bottom-4 bg-white border border-gray-200 rounded-xl shadow-md p-3 flex gap-2 mt-4"
        >
          <input
            type="text"
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || (isChatActive && isTerminal)}
            placeholder={isTerminal && isChatActive ? "This incident is closed" : "Describe your issue..."}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            data-testid="chat-send-btn"
            disabled={loading || !input.trim() || (isChatActive && isTerminal)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

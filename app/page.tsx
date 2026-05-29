"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import ReactMarkdown from "react-markdown";
import { Suspense } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  controls?: UIControl;
}

interface UIControl {
  type: "binary" | "options" | "form";
  options?: string[];
  fields?: { label: string; type: string; name: string }[];
}

interface Incident {
  id: string;
  incidentId: string;
  status: "Open" | "Escalated" | "Resolved";
  category: string;
  subCategory: string;
}

interface FeedbackState {
  rating: number;
  comment: string;
  submitted: boolean;
}

function kbExists(): boolean {
  return true;
}

function ChatPageInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const displayName =
    (session?.user as { username?: string })?.username ||
    session?.user?.email?.split("@")[0] ||
    "there";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ rating: 0, comment: "", submitted: false });
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resumeIncidentId = searchParams.get("resume");

  const loadIncident = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setIncident({ id: data._id, incidentId: data.incidentId, status: data.status, category: data.category, subCategory: data.subCategory });
      setSelectedCategory(data.category);
      const msgs = (data.conversationHistory || []).map((m: { role: string; content: string; timestamp: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.timestamp),
      }));
      setMessages(msgs);
      setIsActive(true);
    } catch {
      // ignore
    }
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setSelectedCategory(null);
    setIncident(null);
    setIsActive(false);
    setFeedback({ rating: 0, comment: "", submitted: false });
    setFormValues({});
    router.replace("/");
  }, [router]);

  useEffect(() => {
    if (resumeIncidentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadIncident(resumeIncidentId);
    }
  }, [resumeIncidentId, loadIncident]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim(), timestamp: new Date() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsActive(true);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          category: selectedCategory,
          incidentId: incident?.id,
          history: nextMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.text || "Patch is having trouble thinking, please try again.",
        timestamp: new Date(),
        controls: data.controls,
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (data.incidentId && !incident) {
        setIncident({
          id: data.incidentId,
          incidentId: data.humanIncidentId || data.incidentId,
          status: "Open",
          category: selectedCategory || "General",
          subCategory: "VDI",
        });
      }

      if (data.status) {
        setIncident(prev => prev ? { ...prev, status: data.status } : prev);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Patch is having trouble thinking, please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleTileClick(category: string) {
    setSelectedCategory(category);
    sendMessage(`I have a problem with my ${category}`);
  }

  function handleControlClick(label: string) {
    sendMessage(label);
  }

  function handleFormSubmit(e: React.FormEvent, fields: { label: string; name: string }[]) {
    e.preventDefault();
    const parts = fields.map(f => `${f.label}: ${formValues[f.name] || ""}`).join(", ");
    sendMessage(parts);
    setFormValues({});
  }

  async function submitFeedback() {
    if (!incident?.id) return;
    await fetch(`/api/incidents/${incident.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: { rating: feedback.rating, comment: feedback.comment } }),
    });
    setFeedback(f => ({ ...f, submitted: true }));
  }

  const isResolved = incident?.status === "Resolved";
  const isEscalated = incident?.status === "Escalated";
  const isEnded = isResolved || isEscalated;

  return (
    <div data-testid="main-page" className="flex flex-col h-screen">
      <Header onNewChat={resetChat} />

      <div className="flex-1 flex flex-col pt-14 overflow-hidden max-w-[1280px] w-full mx-auto">
        {!isActive ? (
          // Pre-chat landing state
          <div data-testid="landing-state" className="flex-1 flex flex-col items-center justify-center px-4">
            <div data-testid="welcome-block" className="text-center mb-10 max-w-2xl">
              <h1 data-testid="welcome-heading" className="text-2xl font-bold text-gray-900 mb-3">
                Welcome to the Discount Tire Information Center, {displayName}. My name is Patch. Let&apos;s get you taken care of.
              </h1>
              <p className="text-gray-500 text-base">Select a category below or type your question to get started.</p>
            </div>

            <div data-testid="category-tiles" className="flex gap-4 mb-8">
              <button
                data-testid="vdi-tile"
                onClick={() => handleTileClick("VDI")}
                className="bg-white border-2 border-gray-200 hover:border-red-500 rounded-xl p-6 w-40 text-center cursor-pointer transition-all shadow-sm hover:shadow-md"
              >
                <div className="text-2xl mb-2">🖥️</div>
                <div data-testid="vdi-tile-title" className="font-semibold text-gray-800 text-sm">VDI</div>
                <div
                  data-testid="vdi-kb-status"
                  className={`text-xs mt-1 font-medium ${kbExists() ? "text-green-600" : "text-red-500"}`}
                >
                  {kbExists() ? "KB Available" : "KB Missing"}
                </div>
              </button>
            </div>
          </div>
        ) : (
          // Active chat state
          <div data-testid="active-chat-state" className="flex-1 flex flex-col overflow-hidden">
            {incident && (
              <div data-testid="incident-header" className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 text-sm">
                <span data-testid="incident-id" className="font-semibold text-gray-700">#{incident.incidentId}</span>
                <span data-testid="incident-category" className="text-gray-500">Category: <span className="text-gray-800 font-medium">{incident.category}</span></span>
                <span
                  data-testid="incident-status"
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    incident.status === "Open" ? "bg-yellow-100 text-yellow-700" :
                    incident.status === "Escalated" ? "bg-red-100 text-red-700" :
                    "bg-green-100 text-green-700"
                  }`}
                >
                  {incident.status}
                </span>
              </div>
            )}

            <div data-testid="chat-messages" className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-[960px] w-full mx-auto">
              {messages.map((msg, i) => (
                <div key={i} data-testid={`message-${i}`}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div
                        data-testid={`user-bubble-${i}`}
                        className="bg-red-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[70%] text-sm leading-relaxed"
                      >
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div
                        data-testid={`assistant-card-${i}`}
                        className="bg-white border-l-2 border-red-500 rounded-xl px-4 py-3 max-w-[80%] text-sm leading-[1.6] shadow-sm prose prose-sm max-w-none"
                        style={{ borderLeftWidth: "2px", borderLeftColor: "#DC2626" }}
                      >
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {msg.controls && !isEnded && i === messages.length - 1 && (
                        <div data-testid="decision-panel" className="max-w-[80%]">
                          {msg.controls.type === "binary" && (
                            <div className="flex gap-2">
                              {["Yes", "No"].map(opt => (
                                <button
                                  key={opt}
                                  data-testid={`control-btn-${opt.toLowerCase()}`}
                                  onClick={() => handleControlClick(opt)}
                                  className="bg-white border border-gray-300 text-gray-800 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}

                          {msg.controls.type === "options" && msg.controls.options && (
                            msg.controls.options.length >= 5 ? (
                              <div className="flex gap-2 items-center">
                                <select
                                  data-testid="control-select"
                                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                  onChange={e => e.target.value && handleControlClick(e.target.value)}
                                  defaultValue=""
                                >
                                  <option value="" disabled>Select an option...</option>
                                  {msg.controls.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {msg.controls.options.map(opt => (
                                  <button
                                    key={opt}
                                    data-testid={`control-option-${opt}`}
                                    onClick={() => handleControlClick(opt)}
                                    className="bg-white border border-gray-300 text-gray-800 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )
                          )}

                          {msg.controls.type === "form" && msg.controls.fields && (
                            <form
                              data-testid="control-form"
                              onSubmit={e => handleFormSubmit(e, msg.controls!.fields!)}
                              className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
                            >
                              {msg.controls.fields.map(field => (
                                <div key={field.name}>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                                  <input
                                    data-testid={`form-field-${field.name}`}
                                    type={field.type}
                                    value={formValues[field.name] || ""}
                                    onChange={e => setFormValues(fv => ({ ...fv, [field.name]: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                  />
                                </div>
                              ))}
                              <button
                                type="submit"
                                data-testid="control-form-submit"
                                className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Submit
                              </button>
                            </form>
                          )}
                        </div>
                      )}

                      {/* Escalation/Resolution summary cards */}
                      {isEscalated && i === messages.length - 1 && incident && (
                        <div data-testid="escalation-card" className="max-w-[80%] bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
                            <span className="font-semibold text-red-700 text-sm">Incident Escalated</span>
                            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">Escalated</span>
                          </div>
                          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-gray-500 text-xs">Incident #</span><div className="font-medium">{incident.incidentId}</div></div>
                            <div><span className="text-gray-500 text-xs">Category</span><div className="font-medium">{incident.category}</div></div>
                            <div><span className="text-gray-500 text-xs">Status</span><div className="font-medium text-red-600">Escalated</div></div>
                            <div><span className="text-gray-500 text-xs">Priority</span><div className="font-medium">5</div></div>
                            <div><span className="text-gray-500 text-xs">Urgency</span><div className="font-medium">3</div></div>
                            <div><span className="text-gray-500 text-xs">Impact</span><div className="font-medium">3</div></div>
                          </div>
                          <div className="px-4 pb-4">
                            <a
                              href={`/incidents/${incident.id}`}
                              data-testid="escalation-detail-link"
                              className="text-red-600 text-sm font-semibold hover:underline"
                            >
                              View Incident Detail →
                            </a>
                          </div>
                        </div>
                      )}

                      {isResolved && i === messages.length - 1 && incident && (
                        <div data-testid="resolved-card" className="max-w-[80%] bg-white border border-green-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center justify-between">
                            <span className="font-semibold text-green-700 text-sm">Issue Resolved</span>
                            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Resolved</span>
                          </div>
                          <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-gray-500 text-xs">Incident #</span><div className="font-medium">{incident.incidentId}</div></div>
                            <div><span className="text-gray-500 text-xs">Category</span><div className="font-medium">{incident.category}</div></div>
                            <div><span className="text-gray-500 text-xs">Date/Time</span><div className="font-medium">{new Date().toLocaleDateString()}</div></div>
                            <div><span className="text-gray-500 text-xs">Status</span><div className="font-medium text-green-600">Resolved</div></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div data-testid="loading-indicator" className="flex">
                  <div className="bg-white border-l-2 border-red-500 rounded-xl px-4 py-3 text-sm text-gray-400 shadow-sm">
                    Patch is thinking...
                  </div>
                </div>
              )}

              {isResolved && !loading && (
                <div data-testid="feedback-card" className="max-w-[80%] bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-3">How was your experience with Patch?</h3>
                  {!feedback.submitted ? (
                    <>
                      <div data-testid="feedback-stars" className="flex gap-2 mb-3">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            data-testid={`star-${star}`}
                            onClick={() => setFeedback(f => ({ ...f, rating: star }))}
                            className={`text-2xl transition-colors ${star <= feedback.rating ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        data-testid="feedback-comment"
                        value={feedback.comment}
                        onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))}
                        placeholder="Optional: Share any additional comments..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        data-testid="feedback-submit-btn"
                        onClick={submitFeedback}
                        disabled={feedback.rating === 0}
                        className="mt-2 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Submit Feedback
                      </button>
                    </>
                  ) : (
                    <p data-testid="feedback-thanks" className="text-green-600 text-sm font-medium">Thank you for your feedback!</p>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Chat Input — pinned to bottom */}
        <div data-testid="chat-input-area" className="bg-white border-t border-gray-200 px-4 py-3 max-w-[960px] w-full mx-auto self-end" style={{ width: "100%" }}>
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-3 items-end max-w-[960px] mx-auto"
          >
            <textarea
              data-testid="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              disabled={isEnded}
              placeholder={isEnded ? "This incident has been closed." : "Type your message... (Enter to send)"}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm resize-none h-11 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50 disabled:text-gray-400"
              rows={1}
            />
            <button
              type="submit"
              data-testid="chat-send-btn"
              disabled={loading || !input.trim() || isEnded}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors h-11"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ChatPageInner />
    </Suspense>
  );
}

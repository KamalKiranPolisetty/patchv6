"use client";

import { useEffect, useState, useRef, FormEvent, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PatchLogo from "@/components/PatchLogo";
import SimpleMarkdown from "@/components/SimpleMarkdown";
import FeedbackCard from "@/components/FeedbackCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ControlMetadata {
  type: "probable_options" | "select_list" | "structured_form";
  options?: string[];
  fieldDefinitions?: { key: string; label: string }[];
  totalCards?: number;
  partialValues?: Record<string, unknown>;
  completionStatus: "awaiting" | "completed";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  probableOptions?: string[];
  inputCardVariables?: Record<string, string>;
  needsCountFirst?: boolean;
  countPrompt?: string;
  totalCards?: number;
  shouldEscalate?: boolean;
  shouldResolve?: boolean;
  escalationData?: Record<string, unknown> | null;
  controlMetadata?: ControlMetadata;
}

interface SessionUser {
  username: string;
  email: string;
  userId: string;
}

type KBStatus = "loading" | "available" | "missing";

interface IncidentState {
  id: string;
  category: string;
  status: "Open" | "Escalated" | "Resolved";
  createdAt?: Date;
}

// Count-based form state
interface CountFormState {
  active: boolean;
  countPrompt: string;
  totalCards: number;
  cardFields: Record<string, string>;
  inputCardVariables: Record<string, string>;
}

// ─── Status badge colors (PATCH-20: Open=yellow, Escalated=red, Resolved=green) ──
const STATUS_STYLES: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Escalated: "bg-red-100 text-red-700 border-red-200",
  Resolved: "bg-green-100 text-green-700 border-green-200",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function VDIIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="28" height="18" rx="3" stroke="#CC0000" strokeWidth="1.8" fill="none" />
      <path d="M11 22v4M21 22v4M8 26h16" stroke="#CC0000" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="6" y="8" width="12" height="8" rx="1.5" stroke="#CC0000" strokeWidth="1.4" fill="none" />
      <circle cx="23" cy="12" r="3" stroke="#CC0000" strokeWidth="1.4" fill="none" />
      <path d="M21.5 12h3M23 10.5v3" stroke="#CC0000" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Escalation Summary Card ─────────────────────────────────────────────────

interface EscalationSummaryCardProps {
  incidentId: string;
  category: string;
  escalationData: Record<string, unknown> | null | undefined;
  user: SessionUser | null;
  createdAt?: Date;
  description?: string;
}

function EscalationSummaryCard({
  incidentId,
  category,
  escalationData,
  user,
  createdAt,
  description,
}: EscalationSummaryCardProps) {
  const esc = escalationData ?? {};
  const str = (key: string) => {
    const v = esc[key];
    return typeof v === "string" && v ? v : null;
  };

  const displayName =
    user?.username ?? (user?.email ? user.email.split("@")[0] : "Associate");

  const dateStr = (createdAt ?? new Date()).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const reason = str("reason");
  const priority = str("priority");
  const urgency = str("urgency");
  const impact = str("impact");
  const group = str("group") ?? str("support_group") ?? str("assignment_group");
  const descriptionText = description ?? str("description");

  return (
    <div
      className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden"
      data-testid="escalation-summary-card"
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-100">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200"
            data-testid="escalation-summary-status-badge"
          >
            Escalated
          </span>
          <span className="text-xs text-red-600 font-medium">Support Ticket Created</span>
        </div>
        <Link
          href={`/incidents/${incidentId}`}
          className="text-xs font-semibold text-[#CC0000] hover:text-[#AA0000] flex items-center gap-1 transition-colors"
          data-testid="escalation-summary-view-link"
        >
          View Incident
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* Fields */}
      <div className="px-4 py-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <dt className="text-gray-500 font-medium">Incident #</dt>
          <dd className="font-mono text-gray-800" data-testid="escalation-summary-incident-id">
            #{incidentId.slice(0, 8)}
          </dd>

          <dt className="text-gray-500 font-medium">Category</dt>
          <dd className="text-gray-800 capitalize" data-testid="escalation-summary-category">
            {category || "General"}
          </dd>

          {descriptionText && (
            <>
              <dt className="text-gray-500 font-medium">Description</dt>
              <dd className="text-gray-800" data-testid="escalation-summary-description">
                {descriptionText}
              </dd>
            </>
          )}

          <dt className="text-gray-500 font-medium">Created For</dt>
          <dd className="text-gray-800" data-testid="escalation-summary-created-for">
            {displayName}
          </dd>

          <dt className="text-gray-500 font-medium">Date / Time</dt>
          <dd className="text-gray-800" data-testid="escalation-summary-datetime">
            {dateStr}
          </dd>

          <dt className="text-gray-500 font-medium">Status</dt>
          <dd data-testid="escalation-summary-status">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
              Escalated
            </span>
          </dd>

          {reason && (
            <>
              <dt className="text-gray-500 font-medium">Reason</dt>
              <dd className="text-gray-800" data-testid="escalation-summary-reason">
                {reason}
              </dd>
            </>
          )}

          {priority && (
            <>
              <dt className="text-gray-500 font-medium">Priority</dt>
              <dd className="text-gray-800" data-testid="escalation-summary-priority">
                {priority}
              </dd>
            </>
          )}

          {urgency && (
            <>
              <dt className="text-gray-500 font-medium">Urgency</dt>
              <dd className="text-gray-800" data-testid="escalation-summary-urgency">
                {urgency}
              </dd>
            </>
          )}

          {impact && (
            <>
              <dt className="text-gray-500 font-medium">Impact</dt>
              <dd className="text-gray-800" data-testid="escalation-summary-impact">
                {impact}
              </dd>
            </>
          )}

          {group && (
            <>
              <dt className="text-gray-500 font-medium">Support Group</dt>
              <dd className="text-gray-800" data-testid="escalation-summary-group">
                {group}
              </dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

// ─── Resolution Summary Card ──────────────────────────────────────────────────

interface ResolutionSummaryCardProps {
  incidentId: string;
  category: string;
  user: SessionUser | null;
  createdAt?: Date;
  description?: string;
}

function ResolutionSummaryCard({
  incidentId,
  category,
  user,
  createdAt,
  description,
}: ResolutionSummaryCardProps) {
  const displayName =
    user?.username ?? (user?.email ? user.email.split("@")[0] : "Associate");

  const dateStr = (createdAt ?? new Date()).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="bg-white border border-green-200 rounded-xl shadow-sm overflow-hidden"
      data-testid="resolution-summary-card"
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-green-50 border-b border-green-100">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200"
            data-testid="resolution-summary-status-badge"
          >
            Resolved
          </span>
          <span className="text-xs text-green-600 font-medium">Issue Successfully Resolved</span>
        </div>
        <Link
          href={`/incidents/${incidentId}`}
          className="text-xs font-semibold text-[#CC0000] hover:text-[#AA0000] flex items-center gap-1 transition-colors"
          data-testid="resolution-summary-view-link"
        >
          View Incident
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* Fields */}
      <div className="px-4 py-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <dt className="text-gray-500 font-medium">Incident #</dt>
          <dd className="font-mono text-gray-800" data-testid="resolution-summary-incident-id">
            #{incidentId.slice(0, 8)}
          </dd>

          <dt className="text-gray-500 font-medium">Category</dt>
          <dd className="text-gray-800 capitalize" data-testid="resolution-summary-category">
            {category || "General"}
          </dd>

          {description && (
            <>
              <dt className="text-gray-500 font-medium">Description</dt>
              <dd className="text-gray-800" data-testid="resolution-summary-description">
                {description}
              </dd>
            </>
          )}

          <dt className="text-gray-500 font-medium">Created For</dt>
          <dd className="text-gray-800" data-testid="resolution-summary-created-for">
            {displayName}
          </dd>

          <dt className="text-gray-500 font-medium">Date / Time</dt>
          <dd className="text-gray-800" data-testid="resolution-summary-datetime">
            {dateStr}
          </dd>

          <dt className="text-gray-500 font-medium">Status</dt>
          <dd data-testid="resolution-summary-status">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
              Resolved
            </span>
          </dd>
        </dl>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LandingClient() {
  const searchParams = useSearchParams();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [kbStatus, setKBStatus] = useState<KBStatus>("loading");
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [incident, setIncident] = useState<IncidentState | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [countForm, setCountForm] = useState<CountFormState>({
    active: false,
    countPrompt: "",
    totalCards: 0,
    cardFields: {},
    inputCardVariables: {},
  });
  const [selectListMsgIdx, setSelectListMsgIdx] = useState<number | null>(null);
  const [selectValue, setSelectValue] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasResumed = useRef(false);

  // ─── Load user + KB status ──────────────────────────────────────────────────

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

  // ─── Auto-scroll ────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // ─── Resume from URL param ──────────────────────────────────────────────────

  useEffect(() => {
    const resumeId = searchParams.get("resume");
    if (!resumeId || hasResumed.current) return;
    hasResumed.current = true;

    fetch(`/api/incidents/${resumeId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { incident: {
        incidentId: string;
        status: "Open" | "Escalated" | "Resolved";
        category: string;
        createdAt: string;
        history: {
          role: "user" | "assistant";
          content: string;
          controlMetadata?: ControlMetadata;
        }[];
      } } | null) => {
        if (!data?.incident) return;
        const inc = data.incident;

        setIncident({
          id: inc.incidentId,
          category: inc.category,
          status: inc.status,
          createdAt: new Date(inc.createdAt),
        });

        const restored: Message[] = inc.history.map((m) => ({
          role: m.role,
          content: m.content,
          probableOptions: m.controlMetadata?.options,
          controlMetadata: m.controlMetadata,
        }));

        setMessages(restored);
        setChatStarted(true);

        if (inc.status !== "Open") {
          setIsReadOnly(true);
          return;
        }

        // Restore last unanswered control
        const lastAssistant = [...inc.history].reverse().find((m) => m.role === "assistant");
        if (lastAssistant?.controlMetadata?.completionStatus === "awaiting") {
          const ctrl = lastAssistant.controlMetadata;
          if (ctrl.type === "structured_form" && ctrl.fieldDefinitions && ctrl.totalCards) {
            setCountForm({
              active: true,
              countPrompt: "",
              totalCards: ctrl.totalCards,
              cardFields: (ctrl.partialValues as Record<string, string>) ?? {},
              inputCardVariables: Object.fromEntries(
                ctrl.fieldDefinitions.map((f) => [f.key, f.label])
              ),
            });
          }
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // ─── sendMessage ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string, category?: string) => {
    if (!text.trim() || sending || isReadOnly) return;
    setSending(true);
    setChatStarted(true);

    const usedCategory = category ?? incident?.category ?? "vdi";
    const usedIncidentId = incident?.id ?? undefined;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");

    setSelectListMsgIdx(null);
    setSelectValue("");

    try {
      const historyForAPI = newMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyForAPI,
          category: usedCategory,
          incidentId: usedIncidentId,
        }),
      });

      const data = await res.json() as {
        incidentId?: string;
        response?: string;
        error?: string;
        user_probable_options?: string[];
        input_card_variables?: Record<string, string>;
        needs_count_first?: boolean;
        count_prompt?: string;
        total_cards?: number;
        should_escalate?: boolean;
        should_resolve?: boolean;
        escalation_data?: Record<string, unknown> | null;
      };

      const isNew = !incident;
      if (data.incidentId && isNew) {
        setIncident({
          id: data.incidentId,
          category: usedCategory,
          status: "Open",
          createdAt: new Date(),
        });
      }

      const probableOptions = data.user_probable_options ?? [];
      const inputCardVars = data.input_card_variables ?? {};
      const shouldEscalate = data.should_escalate ?? false;
      const shouldResolve = data.should_resolve ?? false;

      let controlMeta: ControlMetadata | undefined;
      if (probableOptions.length > 0) {
        controlMeta = {
          type: probableOptions.length >= 5 ? "select_list" : "probable_options",
          options: probableOptions,
          completionStatus: "awaiting",
        };
      } else if (Object.keys(inputCardVars).length > 0 && !data.needs_count_first) {
        const totalCards = data.total_cards ?? 1;
        controlMeta = {
          type: "structured_form",
          fieldDefinitions: Object.entries(inputCardVars).map(([key, label]) => ({ key, label })),
          totalCards,
          completionStatus: "awaiting",
        };
      }

      const assistantMsg: Message = {
        role: "assistant",
        content: data.response ?? data.error ?? "Something went wrong.",
        probableOptions,
        inputCardVariables: inputCardVars,
        needsCountFirst: data.needs_count_first ?? false,
        countPrompt: data.count_prompt ?? "",
        totalCards: data.total_cards ?? 0,
        shouldEscalate,
        shouldResolve,
        escalationData: data.escalation_data ?? null,
        controlMetadata: controlMeta,
      };

      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);

      if (shouldEscalate) {
        setIncident((prev) => prev ? { ...prev, status: "Escalated" } : prev);
        setIsReadOnly(true);
      } else if (shouldResolve) {
        setIncident((prev) => prev ? { ...prev, status: "Resolved" } : prev);
        setIsReadOnly(true);
      }

      if (data.needs_count_first && data.count_prompt) {
        setCountForm((prev) => ({
          ...prev,
          active: false,
          countPrompt: data.count_prompt ?? "",
          inputCardVariables: inputCardVars,
        }));
      }

      if (!data.needs_count_first && data.total_cards && data.total_cards > 0 && Object.keys(inputCardVars).length > 0) {
        setCountForm({
          active: true,
          countPrompt: "",
          totalCards: data.total_cards,
          cardFields: {},
          inputCardVariables: inputCardVars,
        });
      }

      if (probableOptions.length >= 5) {
        setSelectListMsgIdx(updatedMessages.length - 1);
      }

    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }, [sending, isReadOnly, incident, messages]);

  // ─── Handle count answer ────────────────────────────────────────────────────

  function handleCountAnswer(countText: string) {
    const count = parseInt(countText, 10);
    if (!isNaN(count) && count > 0) {
      setCountForm((prev) => ({ ...prev, active: true, totalCards: count }));
    }
    sendMessage(countText);
  }

  // ─── Submit structured form ─────────────────────────────────────────────────

  function submitStructuredForm() {
    const { totalCards, cardFields, inputCardVariables } = countForm;
    const keys = Object.keys(inputCardVariables);
    const parts: string[] = [];
    for (let c = 0; c < totalCards; c++) {
      const deviceParts = keys
        .map((k) => `${inputCardVariables[k]}: ${cardFields[`${c}_${k}`] ?? ""}`)
        .join(", ");
      parts.push(`Device ${c + 1}: ${deviceParts}`);
    }
    setCountForm({ active: false, countPrompt: "", totalCards: 0, cardFields: {}, inputCardVariables: {} });
    sendMessage(parts.join(" | "));
  }

  // ─── Handle form submit ─────────────────────────────────────────────────────

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (countForm.countPrompt && !countForm.active) {
      handleCountAnswer(text);
      return;
    }
    sendMessage(text);
  }

  // ─── Handle option click ────────────────────────────────────────────────────

  function handleOptionClick(opt: string, msgIdx: number) {
    if (sending || isReadOnly) return;
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIdx && m.controlMetadata
          ? { ...m, controlMetadata: { ...m.controlMetadata, completionStatus: "completed" } }
          : m
      )
    );
    sendMessage(opt);
  }

  // ─── Handle select list submit ──────────────────────────────────────────────

  function handleSelectSubmit(msgIdx: number) {
    if (!selectValue || sending || isReadOnly) return;
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIdx && m.controlMetadata
          ? { ...m, controlMetadata: { ...m.controlMetadata, completionStatus: "completed" } }
          : m
      )
    );
    setSelectListMsgIdx(null);
    sendMessage(selectValue);
    setSelectValue("");
  }

  // ─── Derived ────────────────────────────────────────────────────────────────

  const displayName = user?.username ?? (user?.email ? user.email.split("@")[0] : null) ?? "Associate";
  const lastAssistantIdx = messages.reduce<number>((acc, m, i) => (m.role === "assistant" ? i : acc), -1);
  const firstUserMessage = messages.find((m) => m.role === "user")?.content;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col items-center justify-start min-h-full"
      style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(204,0,0,0.04) 0%, transparent 70%), #FAFAF8",
      }}
      data-testid="home-page"
    >
      <div className="w-full max-w-2xl px-6 pt-8 pb-36 flex flex-col gap-6">

        {/* ── Landing hero (pre-chat) ── */}
        {!chatStarted && (
          <div className="flex flex-col items-center gap-8 pt-10" data-testid="hero-block">
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

            {/* VDI Tile */}
            <div className="w-full flex justify-center" data-testid="tiles-section">
              <button
                className="group flex flex-col items-center gap-3 p-8 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#CC0000]/30 hover:-translate-y-0.5 transition-all cursor-pointer"
                style={{ width: "180px" }}
                onClick={() => sendMessage("I have a problem with my VDI", "vdi")}
                data-testid="vdi-tile"
              >
                <VDIIcon />
                <span className="text-sm font-medium text-gray-800" data-testid="vdi-tile-label">VDI</span>
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
                  {kbStatus === "loading" ? "Checking KB…" : kbStatus === "available" ? "KB Available" : "KB Missing"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── Incident header row (active chat) ── */}
        {chatStarted && incident && (
          <div
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm flex-wrap"
            data-testid="incident-header"
          >
            <span className="text-xs font-mono text-gray-400" data-testid="incident-header-id">
              #{incident.id.slice(0, 8)}
            </span>
            <span className="text-xs font-medium text-gray-600 capitalize" data-testid="incident-header-category">
              {incident.category || "General"}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[incident.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
              data-testid="incident-header-status"
            >
              {incident.status}
            </span>
          </div>
        )}

        {/* ── Chat messages ── */}
        {chatStarted && (
          <div className="flex flex-col gap-4" data-testid="chat-messages">
            {messages.map((msg, i) => {
              const isLastAssistant = i === lastAssistantIdx;
              const showControls = msg.role === "assistant" && isLastAssistant && !sending && !isReadOnly;
              const options = msg.probableOptions ?? [];
              const ctrlCompleted = msg.controlMetadata?.completionStatus === "completed";
              const isTerminal = msg.shouldEscalate || msg.shouldResolve;

              return (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${msg.role}-${i}`}
                >
                  {/* Avatar for assistant */}
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-[#CC0000] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 mr-2">
                      P
                    </div>
                  )}

                  <div className={`flex flex-col gap-2 ${isTerminal ? "w-full max-w-[90%]" : "max-w-[80%]"}`}>
                    {/* Message bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-tr-sm bg-[#CC0000] text-white"
                          : "rounded-tl-sm bg-white border border-gray-200 text-gray-800 shadow-sm border-l-[3px] border-l-[#CC0000]"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <SimpleMarkdown content={msg.content} />
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>

                    {/* ── Dynamic controls ── */}
                    {showControls && options.length > 0 && !ctrlCompleted && (
                      <>
                        {options.length <= 4 && (
                          <div
                            className="flex flex-wrap gap-2"
                            data-testid={`probable-options-${i}`}
                          >
                            {options.map((opt, j) => (
                              <button
                                key={j}
                                onClick={() => handleOptionClick(opt, i)}
                                disabled={sending}
                                className="text-xs font-medium bg-[#CC0000] hover:bg-[#AA0000] text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                data-testid={`probable-option-${i}-${j}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {options.length >= 5 && selectListMsgIdx === i && (
                          <div
                            className="flex flex-col gap-2"
                            data-testid={`select-list-${i}`}
                          >
                            <select
                              value={selectValue}
                              onChange={(e) => setSelectValue(e.target.value)}
                              className="text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]/50 bg-white text-gray-800"
                              data-testid={`select-list-input-${i}`}
                            >
                              <option value="">Select an option…</option>
                              {options.map((opt, j) => (
                                <option key={j} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleSelectSubmit(i)}
                              disabled={!selectValue || sending}
                              className="text-xs font-medium bg-[#CC0000] hover:bg-[#AA0000] text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 self-start"
                              data-testid={`select-list-confirm-${i}`}
                            >
                              Confirm
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Escalation outcome flow ── */}
                    {msg.shouldEscalate && incident && (
                      <div
                        className="flex flex-col gap-3"
                        data-testid={`escalation-outcome-${i}`}
                      >
                        <EscalationSummaryCard
                          incidentId={incident.id}
                          category={incident.category}
                          escalationData={msg.escalationData}
                          user={user}
                          createdAt={incident.createdAt}
                          description={firstUserMessage}
                        />
                        <FeedbackCard incidentId={incident.id} />
                      </div>
                    )}

                    {/* ── Resolution outcome flow ── */}
                    {msg.shouldResolve && incident && (
                      <div
                        className="flex flex-col gap-3"
                        data-testid={`resolution-outcome-${i}`}
                      >
                        <ResolutionSummaryCard
                          incidentId={incident.id}
                          category={incident.category}
                          user={user}
                          createdAt={incident.createdAt}
                          description={firstUserMessage}
                        />
                        <FeedbackCard incidentId={incident.id} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {sending && (
              <div className="flex justify-start" data-testid="typing-indicator">
                <div className="w-7 h-7 rounded-full bg-[#CC0000] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 mr-2">
                  P
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border-l-[3px] border-l-[#CC0000]">
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

        {/* ── Structured form (count-based cards) ── */}
        {countForm.active && !sending && !isReadOnly && (
          <StructuredFormCards
            countForm={countForm}
            onChange={(key, val) =>
              setCountForm((prev) => ({
                ...prev,
                cardFields: { ...prev.cardFields, [key]: val },
              }))
            }
            onSubmit={submitStructuredForm}
            disabled={sending}
          />
        )}
      </div>

      {/* ── Fixed chat input ── */}
      <form
        onSubmit={handleFormSubmit}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6"
        data-testid="chat-form"
      >
        <div
          className={`flex gap-3 bg-white border rounded-full shadow-lg px-4 py-3 transition ${
            isReadOnly
              ? "border-gray-200 opacity-60 cursor-not-allowed"
              : "border-gray-200 focus-within:ring-2 focus-within:ring-[#CC0000]/30 focus-within:border-[#CC0000]/50"
          }`}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isReadOnly ? "This incident is closed." : "Describe your issue or type a response…"}
            disabled={sending || isReadOnly}
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent disabled:opacity-60"
            data-testid="chat-input"
          />
          <button
            type="submit"
            disabled={sending || !input.trim() || isReadOnly}
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

// ─── Structured Form Cards component ─────────────────────────────────────────

interface StructuredFormCardsProps {
  countForm: CountFormState;
  onChange: (key: string, val: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

function StructuredFormCards({ countForm, onChange, onSubmit, disabled }: StructuredFormCardsProps) {
  const { totalCards, cardFields, inputCardVariables } = countForm;
  const fieldKeys = Object.keys(inputCardVariables);

  const allFilled = Array.from({ length: totalCards }).every((_, c) =>
    fieldKeys.every((k) => (cardFields[`${c}_${k}`] ?? "").trim() !== "")
  );

  return (
    <div className="flex flex-col gap-4" data-testid="structured-form-cards">
      {Array.from({ length: totalCards }).map((_, cardIdx) => {
        const cardComplete = fieldKeys.every((k) => (cardFields[`${cardIdx}_${k}`] ?? "").trim() !== "");
        return (
          <div
            key={cardIdx}
            className={`bg-white rounded-xl border px-5 py-4 shadow-sm transition-colors ${
              cardComplete ? "border-green-300" : "border-gray-200"
            }`}
            data-testid={`form-card-${cardIdx}`}
          >
            <h3
              className="text-sm font-semibold text-gray-800 mb-3"
              data-testid={`form-card-title-${cardIdx}`}
            >
              Device {cardIdx + 1}
            </h3>
            <div className="flex flex-col gap-3">
              {fieldKeys.map((key) => {
                const val = cardFields[`${cardIdx}_${key}`] ?? "";
                const empty = val.trim() === "";
                return (
                  <div key={key} className="flex flex-col gap-1" data-testid={`form-field-${cardIdx}-${key}`}>
                    <label
                      className="text-xs font-medium text-gray-600"
                      htmlFor={`card-${cardIdx}-${key}`}
                      data-testid={`form-field-label-${cardIdx}-${key}`}
                    >
                      {inputCardVariables[key]}
                    </label>
                    <input
                      id={`card-${cardIdx}-${key}`}
                      type="text"
                      value={val}
                      onChange={(e) => onChange(`${cardIdx}_${key}`, e.target.value)}
                      disabled={disabled}
                      className={`text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#CC0000]/30 focus:border-[#CC0000]/50 transition ${
                        empty ? "border-gray-300" : "border-green-300"
                      }`}
                      data-testid={`form-field-input-${cardIdx}-${key}`}
                    />
                    {empty && (
                      <span className="text-xs text-red-500" data-testid={`form-field-error-${cardIdx}-${key}`}>
                        This field is required.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <button
        onClick={onSubmit}
        disabled={!allFilled || disabled}
        className="self-start text-sm font-semibold bg-[#CC0000] hover:bg-[#AA0000] text-white px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40"
        data-testid="structured-form-submit-btn"
      >
        Submit
      </button>
    </div>
  );
}

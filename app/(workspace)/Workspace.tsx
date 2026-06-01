"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PatchMark } from "@/components/ui/Logo";
import { ChatInput } from "./ChatInput";
import { ActiveChat } from "./ActiveChat";
import { VdiTile } from "./VdiTile";
import type { Incident } from "@/lib/db";
import type { LLMPayload } from "@/lib/llm";

type Props = {
  username: string;
  email: string;
  vdiKBStatus: "KB Available" | "KB Missing";
  resumeIncidentId: string | null;
};

export type ChatState =
  | { mode: "pre-chat" }
  | {
      mode: "active";
      incident: Incident;
      pendingControls: LLMPayload | null;
    };

export function Workspace({ username, email, vdiKBStatus, resumeIncidentId }: Props) {
  const router = useRouter();
  const [state, setState] = useState<ChatState>({ mode: "pre-chat" });
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTriggeredAt, setLastTriggeredAt] = useState<number>(0);

  const displayName =
    username || (email && email.includes("@") ? email.split("@")[0] : "Associate");

  // Resume an existing incident if requested via ?incident=ID
  useEffect(() => {
    if (!resumeIncidentId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/incidents/${resumeIncidentId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.incident) {
          setState({ mode: "active", incident: data.incident, pendingControls: null });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeIncidentId]);

  // New Chat header button: reset back to pre-chat
  useEffect(() => {
    function onNewChat() {
      setState({ mode: "pre-chat" });
      setError(null);
      setIsTyping(false);
      // Clear any ?incident= query so a reload doesn't auto-resume.
      if (typeof window !== "undefined" && window.location.search.includes("incident=")) {
        router.replace("/");
      }
    }
    window.addEventListener("patch:new-chat", onNewChat);
    return () => window.removeEventListener("patch:new-chat", onNewChat);
  }, [router]);

  const sendMessage = useCallback(
    async (content: string, options?: { category?: string; fromTile?: boolean }) => {
      const now = Date.now();
      // Prevent duplicate sends while a previous one is still in flight.
      if (isTyping) return;
      if (now - lastTriggeredAt < 250) return;
      setLastTriggeredAt(now);
      setError(null);

      const category = options?.category ?? (state.mode === "active" ? state.incident.category : "VDI");
      const incidentId = state.mode === "active" ? state.incident.incidentId : null;

      setIsTyping(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ incidentId, category, content }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to send message.");
          return;
        }
        const incident: Incident = data.incident;
        const payload: LLMPayload = data.payload;
        setState({ mode: "active", incident, pendingControls: payload });
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, lastTriggeredAt, state],
  );

  function handleControlsSubmit(value: string) {
    if (state.mode !== "active") return;
    setState({ ...state, pendingControls: null });
    void sendMessage(value, { category: state.incident.category });
  }

  if (state.mode === "pre-chat") {
    return (
      <main
        data-testid="landing-page"
        className="flex-1 landing-gradient flex flex-col items-center justify-center px-4 py-10"
      >
        <div className="w-full max-w-[960px] flex flex-col items-center">
          <div className="mb-6 flex flex-col items-center text-center" data-testid="landing-welcome">
            <PatchMark size={64} className="shadow-sm mb-5" />
            <h1
              data-testid="landing-welcome-line-1"
              className="text-[28px] sm:text-[32px] font-bold text-gray-900 leading-tight"
            >
              Welcome to the Discount Tire Information Center,{" "}
              <span className="text-patch-red" data-testid="landing-username">
                {displayName}
              </span>
              .
            </h1>
            <p
              data-testid="landing-welcome-line-2"
              className="text-[16px] text-gray-500 mt-2 font-normal"
            >
              My name is Patch. Let&apos;s get you taken care of.
            </p>
          </div>

          <div className="mt-4 mb-10">
            <VdiTile kbStatus={vdiKBStatus} onClick={() => {
              void sendMessage("I have a problem with my VDI", { category: "VDI", fromTile: true });
            }} />
          </div>
        </div>

        <div className="w-full max-w-[720px] px-4 pb-6">
          <ChatInput
            disabled={isTyping}
            onSend={(value) => void sendMessage(value)}
            error={error}
            onClearError={() => setError(null)}
            placeholder="Describe the issue you're experiencing…"
          />
        </div>
      </main>
    );
  }

  return (
    <ActiveChat
      incident={state.incident}
      pendingControls={state.pendingControls}
      isTyping={isTyping}
      error={error}
      onSend={(value) => void sendMessage(value)}
      onControlsSubmit={handleControlsSubmit}
      onClearError={() => setError(null)}
      onUpdated={(incident) => setState({ mode: "active", incident, pendingControls: null })}
    />
  );
}

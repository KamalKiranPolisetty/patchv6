"use client";
import { useState } from "react";
import Header from "@/components/Header";
import ChatWorkspace from "@/components/ChatWorkspace";

interface Props {
  username: string;
  tiles: { name: string; kbAvailable: boolean }[];
  initialIncidentId?: string;
}

export default function MainPageClient({ username, tiles, initialIncidentId }: Props) {
  const [resetKey, setResetKey] = useState(0);
  const [currentIncidentId, setCurrentIncidentId] = useState<string | undefined>(initialIncidentId);

  function handleNewChat() {
    setResetKey((k) => k + 1);
    setCurrentIncidentId(undefined);
  }

  return (
    <div className="flex flex-col h-screen" data-testid="main-page">
      <Header onNewChat={handleNewChat} />
      <ChatWorkspace
        username={username}
        tiles={tiles}
        resetKey={resetKey}
        initialIncidentId={currentIncidentId}
      />
    </div>
  );
}

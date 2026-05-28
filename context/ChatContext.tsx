'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export type ChatState = 'landing' | 'active'

interface ChatContextValue {
  chatState: ChatState
  messages: ChatMessage[]
  incidentId: string | null
  category: string | null
  incidentStatus: 'Open' | 'Escalated' | 'Resolved' | null
  setChatState: (state: ChatState) => void
  addMessage: (msg: ChatMessage) => void
  setIncidentId: (id: string) => void
  setCategory: (cat: string) => void
  setIncidentStatus: (status: 'Open' | 'Escalated' | 'Resolved') => void
  resetChat: () => void
  restoreSession: (data: {
    messages: ChatMessage[]
    incidentId: string
    category: string
    status: 'Open' | 'Escalated' | 'Resolved'
  }) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatState, setChatState] = useState<ChatState>('landing')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [incidentId, setIncidentId] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [incidentStatus, setIncidentStatus] = useState<'Open' | 'Escalated' | 'Resolved' | null>(null)

  function addMessage(msg: ChatMessage) {
    setMessages((prev) => [...prev, msg])
  }

  function resetChat() {
    setChatState('landing')
    setMessages([])
    setIncidentId(null)
    setCategory(null)
    setIncidentStatus(null)
  }

  function restoreSession(data: {
    messages: ChatMessage[]
    incidentId: string
    category: string
    status: 'Open' | 'Escalated' | 'Resolved'
  }) {
    setMessages(data.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })))
    setIncidentId(data.incidentId)
    setCategory(data.category)
    setIncidentStatus(data.status)
    setChatState('active')
  }

  return (
    <ChatContext.Provider
      value={{
        chatState,
        messages,
        incidentId,
        category,
        incidentStatus,
        setChatState,
        addMessage,
        setIncidentId,
        setCategory,
        setIncidentStatus,
        resetChat,
        restoreSession,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
  return ctx
}

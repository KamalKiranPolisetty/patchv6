'use client';

import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatMessage from './ChatMessage';
import SummaryCard from './SummaryCard';
import { ControlDef } from './DynamicControls';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  control?: ControlDef;
  timestamp?: Date;
}

interface IncidentData {
  incidentId: string;
  category: string;
  status: 'Open' | 'Escalated' | 'Resolved';
  escalationData?: {
    reason?: string;
    group?: string;
    priority?: string;
    urgency?: string;
    impact?: string;
    timestamp?: string;
  };
  resolutionData?: {
    timestamp?: string;
    summary?: string;
  };
}

interface ChatInterfaceProps {
  username: string;
}

export default function ChatInterface({ username }: ChatInterfaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [incidentData, setIncidentData] = useState<IncidentData | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [kbAvailable, setKbAvailable] = useState<boolean | null>(null);

  const CATEGORY = 'vdi';

  // Check KB availability
  useEffect(() => {
    fetch('/api/kb/check?category=vdi')
      .then((r) => r.json())
      .then((d: { available?: boolean }) => setKbAvailable(d.available || false))
      .catch(() => setKbAvailable(false));
  }, []);

  const loadIncident = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}`);
      if (!res.ok) return;
      const data = await res.json() as { incident?: { history?: Array<{ role: 'user' | 'assistant'; content: string; control?: ControlDef }>; category?: string; status?: 'Open' | 'Escalated' | 'Resolved'; escalationData?: IncidentData['escalationData']; resolutionData?: IncidentData['resolutionData'] } };
      if (!data.incident) return;

      setIncidentId(id);
      setIncidentData({
        incidentId: id,
        category: data.incident.category || CATEGORY,
        status: data.incident.status || 'Open',
        escalationData: data.incident.escalationData,
        resolutionData: data.incident.resolutionData,
      });

      const history = (data.incident.history || []).map((m) => ({
        role: m.role,
        content: m.content,
        control: m.control,
      }));
      setMessages(history);
      setIsActive(true);
    } catch {
      // ignore
    }
  }, []);

  // Handle URL params
  useEffect(() => {
    const incidentIdParam = searchParams.get('incidentId');
    const newchat = searchParams.get('newchat');

    if (newchat === '1') {
      startTransition(() => {
        setMessages([]);
        setIncidentId(null);
        setIncidentData(null);
        setIsActive(false);
      });
      // Remove the query param
      router.replace('/');
      return;
    }

    if (incidentIdParam) {
      startTransition(() => {
        void loadIncident(incidentIdParam);
      });
    }
  }, [searchParams, router, loadIncident]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function sendMessage(messageText: string, formData?: Record<string, Record<string, string>>) {
    if (isTyping || !messageText.trim()) return;

    // If form data, format it as a message
    let finalMessage = messageText.trim();
    if (formData) {
      const parts = Object.entries(formData).map(([cardIdx, fields]) => {
        const fieldStr = Object.entries(fields)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        return `Device ${Number(cardIdx) + 1}: ${fieldStr}`;
      });
      finalMessage = parts.join('\n');
    }

    setMessages((prev) => [...prev, { role: 'user', content: finalMessage }]);
    setInputValue('');
    setIsActive(true);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: finalMessage,
          incidentId: incidentId || undefined,
          category: CATEGORY,
        }),
      });

      const data = await res.json() as {
        incidentId?: string;
        response?: string;
        controls?: ControlDef;
        status?: 'Open' | 'Escalated' | 'Resolved';
        incidentData?: IncidentData;
        error?: string;
      };

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'An error occurred. Please try again.' },
        ]);
        return;
      }

      if (data.incidentId) setIncidentId(data.incidentId);
      if (data.incidentData) setIncidentData(data.incidentData);

      const control =
        data.controls && data.controls.type !== 'none' ? data.controls : undefined;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || '',
          control,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please check your connection and try again.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleFormSubmit(submit: React.FormEvent) {
    submit.preventDefault();
    if (inputValue.trim()) {
      void sendMessage(inputValue);
    }
  }

  const lastAssistantIndex = messages.reduce((acc, m, i) => (m.role === 'assistant' ? i : acc), -1);

  const isClosed = incidentData?.status === 'Escalated' || incidentData?.status === 'Resolved';

  return (
    <div className="flex flex-col flex-1 relative">
      {!isActive ? (
        /* Pre-chat landing */
        <div
          className="flex-1 flex flex-col items-center justify-center px-4 py-12"
          style={{
            background: 'radial-gradient(ellipse at center, #FFF5F5 0%, #F9FAFB 70%)',
          }}
        >
          <div className="w-full max-w-2xl mx-auto">
            {/* Welcome */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">P</span>
              </div>
              <p className="text-lg text-gray-700 mb-1" data-testid="landing-welcome">
                Welcome to the Discount Tire Information Center,{' '}
                <span className="font-semibold" style={{ color: '#DC2626' }}>{username}</span>.
              </p>
              <p className="text-gray-500 text-sm">
                My name is Patch. Let&apos;s get you taken care of.
              </p>
            </div>

            {/* VDI Tile */}
            <div className="flex justify-center mb-8">
              <button
                data-testid="vdi-tile"
                onClick={() => {
                  setIsActive(true);
                  void sendMessage('I need help with VDI.');
                }}
                className="w-48 bg-white border border-gray-200 rounded-2xl p-5 text-center hover:border-red-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-1">VDI</p>
                <p className="text-xs text-gray-400">Virtual Desktop</p>
                <div className="mt-2">
                  {kbAvailable === null ? (
                    <span className="text-xs text-gray-400">Checking...</span>
                  ) : kbAvailable ? (
                    <span
                      data-testid="kb-status-badge"
                      className="inline-block text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium"
                    >
                      KB Available
                    </span>
                  ) : (
                    <span
                      data-testid="kb-status-badge"
                      className="inline-block text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5"
                    >
                      No KB
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Chat input */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-2 flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(inputValue); }}}
                placeholder="Describe your IT issue..."
                data-testid="chat-input"
                className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
              />
              <button
                onClick={() => void sendMessage(inputValue)}
                disabled={!inputValue.trim()}
                data-testid="chat-send-btn"
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Active chat */
        <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-4">
          {/* Incident header */}
          {incidentData && (
            <div
              data-testid="incident-header"
              className="mb-4 flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5"
            >
              <span className="text-xs font-mono text-gray-500">{incidentData.incidentId}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                {incidentData.category}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  incidentData.status === 'Open'
                    ? 'bg-blue-100 text-blue-700'
                    : incidentData.status === 'Escalated'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {incidentData.status}
              </span>
            </div>
          )}

          {/* Messages */}
          <div
            data-testid="chat-messages"
            className="flex-1 space-y-4 pb-4"
          >
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                control={msg.control}
                onOptionClick={(opt) => void sendMessage(opt)}
                onFormSubmit={(data) => void sendMessage('', data)}
                index={i}
                isLastAssistant={i === lastAssistantIndex && !isTyping && !isClosed}
              />
            ))}
            {isTyping && <ChatMessage role="assistant" content="" isTyping />}
            <div ref={messagesEndRef} />
          </div>

          {/* Escalation / Resolution summaries */}
          {incidentData?.status === 'Escalated' && incidentData.escalationData && (
            <SummaryCard
              type="escalation"
              incidentId={incidentData.incidentId}
              escalationData={incidentData.escalationData}
            />
          )}
          {incidentData?.status === 'Resolved' && incidentData.resolutionData && (
            <SummaryCard
              type="resolution"
              incidentId={incidentData.incidentId}
              resolutionData={incidentData.resolutionData}
            />
          )}

          {/* Composer */}
          {!isClosed && (
            <form
              onSubmit={handleFormSubmit}
              className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-2 flex items-center gap-2 sticky bottom-4"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(inputValue);
                  }
                }}
                placeholder="Type your response..."
                data-testid="chat-input"
                disabled={isTyping}
                className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                data-testid="chat-send-btn"
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
              >
                Send
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import StatusBadge from './components/StatusBadge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatState {
  incidentId: string | null;
  status: 'Open' | 'Escalated' | 'Resolved' | null;
  category: string | null;
  messages: Message[];
  createdAt?: string;
}

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [kbAvailable, setKbAvailable] = useState<boolean | null>(null);
  const [chatState, setChatState] = useState<ChatState>({
    incidentId: null,
    status: null,
    category: null,
    messages: [],
  });
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isActive = chatState.messages.length > 0;
  const isResolved = chatState.status === 'Resolved';

  useEffect(() => {
    const emailFromCookie = document.cookie.split(';').find(c => c.trim().startsWith('username='));
    if (!emailFromCookie) {
      fetch('/api/incidents').then(r => r.json()).then(() => {}).catch(() => {});
    }
    fetch('/api/kb-status?category=VDI')
      .then(r => r.json())
      .then(d => setKbAvailable(d.available))
      .catch(() => setKbAvailable(false));

    // Attempt to get username from a simple session check endpoint or cookie
    // We'll just use the email from the cookie if available
    const cookies = Object.fromEntries(document.cookie.split(';').map(c => {
      const [k, v] = c.trim().split('=');
      return [k, v];
    }));
    if (cookies.username) setUsername(decodeURIComponent(cookies.username));
  }, []);

  useEffect(() => {
    // Read username from the session by making a light call
    fetch('/api/incidents')
      .then(r => r.json())
      .then(() => {})
      .catch(() => {});
  }, []);

  // Get username from the JWT token via a dedicated endpoint
  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.username) setUsername(d.username);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  // Load resumed chat from localStorage
  useEffect(() => {
    const resume = localStorage.getItem('patch_resume_chat');
    if (resume) {
      localStorage.removeItem('patch_resume_chat');
      try {
        const data = JSON.parse(resume);
        setChatState({
          incidentId: data.incidentId,
          status: data.status,
          category: data.category,
          messages: data.conversationHistory?.map((m: { role: 'user' | 'assistant'; content: string; timestamp?: string }) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })) || [],
          createdAt: data.createdAt,
        });
      } catch {
        // ignore
      }
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setChatState({ incidentId: null, status: null, category: null, messages: [] });
    setInputText('');
  }, []);

  async function sendMessage(text: string) {
    if (!text.trim() || sending || isResolved) return;
    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() };
    setChatState(prev => ({ ...prev, messages: [...prev.messages, userMsg] }));
    setInputText('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          incidentId: chatState.incidentId,
          category: chatState.category,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        const assistantMsg: Message = {
          role: 'assistant',
          content: JSON.stringify(data.llmResponse),
          timestamp: new Date().toISOString(),
        };
        setChatState(prev => ({
          ...prev,
          incidentId: data.incidentId,
          status: data.status,
          messages: [...prev.messages, assistantMsg],
          createdAt: prev.createdAt || new Date().toISOString(),
        }));

        // If resolved by user confirmation, update status
        if (data.status === 'Resolved') {
          setChatState(prev => ({ ...prev, status: 'Resolved' }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  }

  async function handleVDISelect() {
    setChatState(prev => ({ ...prev, category: 'VDI' }));
    await sendMessageWithCategory('VDI', 'I need help with my VDI');
  }

  async function sendMessageWithCategory(cat: string, text: string) {
    if (!text.trim() || sending) return;
    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: new Date().toISOString() };
    setChatState(prev => ({ ...prev, category: cat, messages: [...prev.messages, userMsg] }));
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          incidentId: null,
          category: cat,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        const assistantMsg: Message = {
          role: 'assistant',
          content: JSON.stringify(data.llmResponse),
          timestamp: new Date().toISOString(),
        };
        setChatState(prev => ({
          ...prev,
          incidentId: data.incidentId,
          status: data.status,
          messages: [...prev.messages, assistantMsg],
          createdAt: new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  }

  async function handleResolve() {
    if (!chatState.incidentId) return;
    await fetch(`/api/incidents/${chatState.incidentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Resolved' }),
    });

    const resolvedResponse = JSON.stringify({
      response: '**Great news! I\'m glad we could resolve your issue.** Your incident has been marked as resolved. If you experience this issue again, feel free to start a new chat session.',
      user_probable_options: [],
      input_card_variables: [],
      total_cards: 1,
      should_escalate: false,
      escalation_data: { category: '', subcategory: '', priority: '', urgency: '', impact: '', reason: '', status: 'Escalated' },
    });

    setChatState(prev => ({
      ...prev,
      status: 'Resolved',
      messages: [...prev.messages, { role: 'assistant', content: resolvedResponse, timestamp: new Date().toISOString() }],
    }));
  }

  function handleOptionSelect(option: string) {
    // Check if option indicates resolution
    const resolveKeywords = ['resolved', 'fixed', 'working', 'yes, it is resolved', 'yes, the issue is resolved'];
    if (resolveKeywords.some(k => option.toLowerCase().includes(k))) {
      handleResolve();
    } else {
      sendMessage(option);
    }
  }

  const displayName = username || 'Associate';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F9FAFB' }}>
      <Header username={displayName} onNewChat={handleNewChat} />

      <main
        data-testid="main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxWidth: 1280,
          width: '100%',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        {/* Incident header when active */}
        {isActive && chatState.incidentId && (
          <div
            data-testid="incident-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 0 8px',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              <strong style={{ color: '#111827' }}>{chatState.incidentId}</strong>
            </span>
            {chatState.category && (
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>· {chatState.category}</span>
            )}
            {chatState.status && (
              <StatusBadge status={chatState.status as 'Open' | 'Escalated' | 'Resolved'} />
            )}
          </div>
        )}

        {/* Chat area or landing */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!isActive ? (
            // Landing state
            <div
              data-testid="landing-state"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: 700,
                margin: '0 auto',
                width: '100%',
                paddingBottom: 120,
              }}
            >
              <div data-testid="welcome-block" style={{ textAlign: 'center', marginBottom: 36 }}>
                <h1 data-testid="welcome-heading" style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1.4, marginBottom: 8 }}>
                  Welcome to the Discount Tire Information Center,{' '}
                  <span style={{ color: '#DC2626' }}>{displayName}</span>.
                </h1>
                <p data-testid="welcome-subtext" style={{ fontSize: 16, color: '#6B7280', margin: 0 }}>
                  My name is Patch. Let&apos;s get you taken care of.
                </p>
              </div>

              <div data-testid="category-tiles" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  data-testid="vdi-category-tile"
                  onClick={handleVDISelect}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: '20px 32px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    minWidth: 160,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#DC2626';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(220,38,38,0.12)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🖥️</div>
                  <div data-testid="vdi-label" style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>VDI</div>
                  <div
                    data-testid="vdi-kb-status"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: kbAvailable ? '#065F46' : '#92400E',
                      background: kbAvailable ? '#D1FAE5' : '#FEF3C7',
                      padding: '2px 8px',
                      borderRadius: 4,
                      display: 'inline-block',
                    }}
                  >
                    {kbAvailable === null ? '...' : kbAvailable ? 'KB Available' : 'KB Missing'}
                  </div>
                </button>
              </div>
            </div>
          ) : (
            // Active chat state
            <div
              data-testid="chat-area"
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingTop: 16,
                paddingBottom: 8,
                maxWidth: 800,
                width: '100%',
                margin: '0 auto',
              }}
            >
              {chatState.messages.map((msg, i) => {
                const isLast = i === chatState.messages.length - 1;
                const isFinished = chatState.status === 'Escalated' || chatState.status === 'Resolved';
                return (
                  <ChatMessage
                    key={i}
                    role={msg.role}
                    content={msg.content}
                    incidentId={chatState.incidentId || undefined}
                    incidentStatus={chatState.status as 'Open' | 'Escalated' | 'Resolved' | undefined}
                    category={chatState.category || undefined}
                    createdAt={chatState.createdAt}
                    username={displayName}
                    onOptionSelect={handleOptionSelect}
                    onFormSubmit={vals => sendMessage(vals.formatted || JSON.stringify(vals))}
                    isLatest={isLast && !isFinished}
                    showFeedback={isLast && isFinished}
                  />
                );
              })}
              {sending && (
                <div data-testid="typing-indicator" style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, background: '#DC2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 3h4.5a2.5 2.5 0 010 5H3V3z" fill="white"/>
                    </svg>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderLeft: '2px solid #DC2626', borderRadius: '4px 16px 16px 16px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, background: '#9CA3AF', borderRadius: '50%', animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Chat input */}
        <div
          data-testid="chat-input-area"
          style={{
            padding: '12px 0 20px',
            maxWidth: 800,
            width: '100%',
            margin: '0 auto',
          }}
        >
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(inputText); }}
            style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                data-testid="chat-input"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(inputText);
                  }
                }}
                disabled={isResolved}
                placeholder={
                  isResolved
                    ? 'This incident is resolved. Start a new chat to continue.'
                    : isActive
                    ? 'Type your reply...'
                    : 'Describe your issue or select a category above...'
                }
                rows={1}
                style={{
                  width: '100%',
                  border: '1px solid #D1D5DB',
                  borderRadius: 10,
                  padding: '12px 48px 12px 16px',
                  fontSize: 14,
                  color: '#111827',
                  resize: 'none',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: isResolved ? '#F3F4F6' : '#fff',
                  cursor: isResolved ? 'not-allowed' : 'text',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  lineHeight: 1.5,
                  maxHeight: 120,
                  overflowY: 'auto',
                }}
                onFocus={e => { if (!isResolved) e.target.style.borderColor = '#DC2626'; }}
                onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
              />
            </div>
            <button
              data-testid="send-btn"
              type="submit"
              disabled={!inputText.trim() || sending || isResolved}
              style={{
                background: inputText.trim() && !sending && !isResolved ? '#DC2626' : '#E5E7EB',
                color: inputText.trim() && !sending && !isResolved ? '#fff' : '#9CA3AF',
                border: 'none',
                borderRadius: 10,
                padding: '12px 18px',
                cursor: !inputText.trim() || sending || isResolved ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: 14,
                transition: 'background 0.15s, color 0.15s',
                flexShrink: 0,
                height: 46,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          </form>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

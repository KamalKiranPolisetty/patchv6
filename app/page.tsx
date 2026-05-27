'use client';

import { useState, useEffect, useRef, FormEvent, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface KbStatus {
  VDI: boolean;
  Printer: boolean;
}

function MainContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resume');

  const [userEmail, setUserEmail] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'VDI' | 'Printer' | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const [incidentStatus, setIncidentStatus] = useState<string>('Open');
  const [kbStatus, setKbStatus] = useState<KbStatus>({ VDI: false, Printer: false });
  const [uploadCategory, setUploadCategory] = useState<'VDI' | 'Printer'>('VDI');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isChatActive = chatMessages.length > 0;
  const isClosed = incidentStatus === 'Resolved' || incidentStatus === 'Escalated';

  const fetchKbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/kb/status');
      if (res.ok) {
        const data = await res.json();
        setKbStatus(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const match = document.cookie.split('; ').find((r) => r.startsWith('patch_email='));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (match) setUserEmail(decodeURIComponent(match.split('=')[1]));
    fetchKbStatus();
  }, [fetchKbStatus]);

  useEffect(() => {
    if (!resumeId) return;
    fetch(`/api/chat/history/${resumeId}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const t = data.transaction;
        setIncidentId(t.incidentId);
        setIncidentStatus(t.status);
        setSelectedCategory(t.category);
        setChatMessages(
          t.conversationHistory.map((m: { role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
          }))
        );
        if (t.status === 'Resolved' || t.status === 'Escalated') {
          setShowFeedback(!t.feedbackRating);
          setFeedbackSent(!!t.feedbackRating);
        }
      })
      .catch(() => { /* ignore */ });
  }, [resumeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function handleNewChat() {
    setSelectedCategory(null);
    setChatMessages([]);
    setInputValue('');
    setIncidentId(null);
    setIncidentStatus('Open');
    setShowFeedback(false);
    setFeedbackSent(false);
    setFeedbackRating(0);
    router.replace('/');
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || isClosed) return;

    const msg = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    setChatMessages((prev) => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, incidentId, category: selectedCategory }),
      });
      const data = await res.json();

      if (!res.ok) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'Patch is having trouble thinking. Please try again in a moment.', timestamp: new Date() },
        ]);
        return;
      }

      if (data.isNew) setIncidentId(data.incidentId);
      setIncidentStatus(data.status);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response, timestamp: new Date() },
      ]);
      if (data.status === 'Resolved' || data.status === 'Escalated') {
        setShowFeedback(true);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Patch is having trouble thinking. Please try again in a moment.', timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setUploadError('Only .docx files are supported.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadCategory);
      const res = await fetch('/api/kb/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Failed to upload document. Please try again.');
      } else {
        setUploadSuccess(`Document uploaded for ${uploadCategory}.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchKbStatus();
      }
    } catch {
      setUploadError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleFeedback(rating: number) {
    setFeedbackRating(rating);
    if (!incidentId) return;
    try {
      await fetch(`/api/incidents/${incidentId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      setFeedbackSent(true);
    } catch {
      // ignore
    }
  }

  const displayName = userEmail ? userEmail.split('@')[0] : 'there';

  return (
    <div data-testid="main-page" className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header data-testid="main-header" className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
        <div data-testid="logo-section" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-lg text-gray-900">Patch</span>
        </div>

        <div data-testid="welcome-message" className="text-sm text-gray-600 hidden md:block">
          Welcome, <span className="font-medium">{displayName}</span>
        </div>

        <nav data-testid="header-nav" className="flex items-center gap-2">
          <button
            data-testid="nav-incidents-btn"
            onClick={() => router.push('/incidents')}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Incidents
          </button>
          <button
            data-testid="nav-new-chat-btn"
            onClick={handleNewChat}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            New Chat
          </button>
          <button
            data-testid="nav-logout-btn"
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </nav>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Pre-chat Landing State */}
        {!isChatActive && (
          <div data-testid="landing-state" className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-10">
              <section data-testid="welcome-section" className="mb-8 text-center">
                <h2 data-testid="welcome-heading" className="text-2xl font-bold text-gray-900 mb-2">
                  Hi {displayName}, how can I help?
                </h2>
                <p className="text-gray-500">
                  Select a category or type your question below.
                </p>
              </section>

              <section data-testid="category-tiles" className="grid grid-cols-2 gap-4 mb-8">
                {(['VDI', 'Printer'] as const).map((cat) => (
                  <button
                    key={cat}
                    data-testid={`tile-${cat.toLowerCase()}`}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      selectedCategory === cat
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{cat === 'VDI' ? '🖥️' : '🖨️'}</span>
                      <span
                        data-testid={`tile-${cat.toLowerCase()}-status`}
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          kbStatus[cat] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {kbStatus[cat] ? '✓ Doc Available' : '⚠ Upload Needed'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{cat}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {cat === 'VDI' ? 'Virtual desktop issues & connectivity' : 'Printer setup & troubleshooting'}
                    </p>
                  </button>
                ))}
              </section>

              <section data-testid="upload-section" className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 data-testid="upload-heading" className="font-semibold text-gray-900 mb-4">
                  Upload Knowledge Base Document
                </h3>
                <form onSubmit={handleUpload} data-testid="upload-form" className="space-y-3">
                  <div className="flex gap-3 flex-wrap">
                    <select
                      data-testid="upload-category-select"
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as 'VDI' | 'Printer')}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="VDI">VDI</option>
                      <option value="Printer">Printer</option>
                    </select>
                    <input
                      ref={fileInputRef}
                      data-testid="upload-file-input"
                      type="file"
                      accept=".docx"
                      className="flex-1 text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 min-w-0"
                    />
                    <button
                      type="submit"
                      data-testid="upload-submit-btn"
                      disabled={uploading}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:bg-orange-400 transition-colors"
                    >
                      {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                  </div>
                  {uploadError && (
                    <p data-testid="upload-error" className="text-red-600 text-sm">{uploadError}</p>
                  )}
                  {uploadSuccess && (
                    <p data-testid="upload-success" className="text-green-600 text-sm">{uploadSuccess}</p>
                  )}
                </form>
              </section>
            </div>
          </div>
        )}

        {/* Active Chat State */}
        {isChatActive && (
          <div data-testid="chat-state" className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
            <div className="max-w-3xl mx-auto space-y-4">
              {incidentId && (
                <div className="text-center">
                  <span data-testid="incident-badge" className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {incidentId}{selectedCategory ? ` · ${selectedCategory}` : ''}
                  </span>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  data-testid={`chat-message-${msg.role}`}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <span className="text-orange-700 text-xs font-bold">P</span>
                    </div>
                  )}
                  <div
                    className={`max-w-lg rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-orange-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div data-testid="patch-typing" className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <span className="text-orange-700 text-xs font-bold">P</span>
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-500 italic">
                    Patch is typing…
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Feedback */}
        {showFeedback && !feedbackSent && (
          <div data-testid="feedback-section" className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm text-gray-700 mb-3">
                How was this experience? Your feedback helps us improve the AI Agent.
              </p>
              <div data-testid="star-rating" className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    data-testid={`star-${star}`}
                    onClick={() => handleFeedback(star)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      star <= feedbackRating ? 'text-amber-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {feedbackSent && (
          <div data-testid="feedback-sent" className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex-shrink-0">
            <p className="text-sm text-green-600 text-center">Thank you for your feedback!</p>
          </div>
        )}

        {/* Chat Input */}
        <div data-testid="chat-input-section" className="border-t border-gray-200 bg-white px-4 py-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            {selectedCategory && !isChatActive && (
              <div className="mb-2">
                <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                  Category: {selectedCategory}
                </span>
              </div>
            )}
            <form onSubmit={handleSendMessage} data-testid="chat-form" className="flex gap-3">
              <input
                data-testid="chat-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isClosed || isLoading}
                placeholder={
                  isClosed
                    ? 'This incident is closed. Start a New Chat.'
                    : 'Describe your issue…'
                }
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                type="submit"
                data-testid="chat-send-btn"
                disabled={!inputValue.trim() || isLoading || isClosed}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 disabled:bg-orange-300 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>}>
      <MainContent />
    </Suspense>
  );
}

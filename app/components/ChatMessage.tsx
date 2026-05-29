'use client';

import ReactMarkdown from 'react-markdown';
import IncidentSummaryCard from './IncidentSummaryCard';
import FeedbackCard from './FeedbackCard';

interface LLMResponse {
  response: string;
  user_probable_options: string[];
  input_card_variables: string[];
  total_cards: number;
  should_escalate: boolean;
  escalation_data?: {
    category?: string;
    subcategory?: string;
    priority?: string;
    urgency?: string;
    impact?: string;
    reason?: string;
    status?: string;
  };
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  incidentId?: string;
  incidentStatus?: 'Open' | 'Escalated' | 'Resolved';
  category?: string;
  createdAt?: string;
  username?: string;
  onOptionSelect?: (option: string) => void;
  onFormSubmit?: (values: Record<string, string>) => void;
  isLatest?: boolean;
  showFeedback?: boolean;
  existingFeedback?: { rating: number; comment: string };
}

function parseLLMContent(content: string): LLMResponse | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export default function ChatMessage({
  role,
  content,
  incidentId,
  incidentStatus,
  category,
  createdAt,
  username,
  onOptionSelect,
  onFormSubmit,
  isLatest,
  showFeedback,
  existingFeedback,
}: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div data-testid="user-message" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div
          style={{
            background: '#DC2626',
            color: '#FFFFFF',
            borderRadius: '16px 16px 4px 16px',
            padding: '10px 16px',
            maxWidth: '70%',
            fontSize: 14,
            lineHeight: 1.5,
            fontWeight: 400,
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  const parsed = parseLLMContent(content);

  if (!parsed) {
    return (
      <div data-testid="assistant-message" style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <PatchAvatar />
        <div style={{ flex: 1 }}>
          <AssistantCard>
            <div className="prose" style={{ fontSize: 14, color: '#374151' }}>
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </AssistantCard>
        </div>
      </div>
    );
  }

  const isEscalation = parsed.should_escalate || incidentStatus === 'Escalated';
  const isResolved = incidentStatus === 'Resolved';

  return (
    <div data-testid="assistant-message" style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
      <PatchAvatar />
      <div style={{ flex: 1 }}>
        {isEscalation && incidentId ? (
          <div data-testid="escalation-card">
            <AssistantCard>
              <div className="prose" style={{ fontSize: 14, color: '#374151' }}>
                <ReactMarkdown>{parsed.response}</ReactMarkdown>
              </div>
              <IncidentSummaryCard
                incidentId={incidentId}
                category={category || ''}
                status="Escalated"
                createdAt={createdAt || new Date().toISOString()}
                username={username || ''}
                escalationData={parsed.escalation_data || {}}
              />
            </AssistantCard>
            {(showFeedback || isLatest) && (
              <FeedbackCard incidentId={incidentId} existingFeedback={existingFeedback} readOnly={!!existingFeedback?.rating} />
            )}
          </div>
        ) : isResolved && incidentId ? (
          <div data-testid="resolved-card">
            <AssistantCard>
              <div className="prose" style={{ fontSize: 14, color: '#374151' }}>
                <ReactMarkdown>{parsed.response}</ReactMarkdown>
              </div>
              <IncidentSummaryCard
                incidentId={incidentId}
                category={category || ''}
                status="Resolved"
                createdAt={createdAt || new Date().toISOString()}
                username={username || ''}
              />
            </AssistantCard>
            {(showFeedback || isLatest) && (
              <FeedbackCard incidentId={incidentId} existingFeedback={existingFeedback} readOnly={!!existingFeedback?.rating} />
            )}
          </div>
        ) : (
          <AssistantCard>
            <div className="prose" style={{ fontSize: 14, color: '#374151' }}>
              <ReactMarkdown>{parsed.response}</ReactMarkdown>
            </div>

            {isLatest && parsed.user_probable_options && parsed.user_probable_options.length > 0 && (
              <DynamicOptions
                options={parsed.user_probable_options}
                onSelect={onOptionSelect}
              />
            )}

            {isLatest && parsed.input_card_variables && parsed.input_card_variables.length > 0 && (
              <StructuredForm
                fields={parsed.input_card_variables}
                onSubmit={onFormSubmit}
              />
            )}
          </AssistantCard>
        )}
      </div>
    </div>
  );
}

function AssistantCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-testid="assistant-card"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderLeft: '2px solid #DC2626',
        borderRadius: '4px 16px 16px 16px',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {children}
    </div>
  );
}

function PatchAvatar() {
  return (
    <div
      data-testid="patch-avatar"
      style={{
        width: 30,
        height: 30,
        background: '#DC2626',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 4,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3 3h4.5a2.5 2.5 0 010 5H3V3z" fill="white" strokeWidth="1" stroke="white" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function DynamicOptions({ options, onSelect }: { options: string[]; onSelect?: (o: string) => void }) {
  if (options.length >= 5) {
    return (
      <div data-testid="options-select-container" style={{ marginTop: 12 }}>
        <select
          data-testid="options-select"
          onChange={e => { if (e.target.value && onSelect) { onSelect(e.target.value); e.target.value = ''; } }}
          style={{
            width: '100%',
            border: '1px solid #D1D5DB',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            color: '#374151',
            background: '#fff',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <option value="">Select an option...</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div data-testid="options-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      {options.map((opt, i) => (
        <button
          key={i}
          data-testid={`option-chip-${i}`}
          onClick={() => onSelect?.(opt)}
          style={{
            background: '#FFFFFF',
            border: '1px solid #D1D5DB',
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 13,
            color: '#374151',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = '#DC2626'; (e.target as HTMLButtonElement).style.color = '#DC2626'; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = '#D1D5DB'; (e.target as HTMLButtonElement).style.color = '#374151'; }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function StructuredForm({ fields, onSubmit }: { fields: string[]; onSubmit?: (vals: Record<string, string>) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formatted = Object.entries(values).map(([k, v]) => `${k}: ${v}`).join(', ');
    onSubmit?.({ formatted, ...values });
  }

  return (
    <form data-testid="structured-form" onSubmit={handleSubmit} style={{ marginTop: 12, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 14px' }}>
      {fields.map((field, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{field}</label>
          <input
            data-testid={`form-field-${i}`}
            type="text"
            value={values[field] || ''}
            onChange={e => setValues(p => ({ ...p, [field]: e.target.value }))}
            style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 6, padding: '7px 10px', fontSize: 13, color: '#374151', fontFamily: 'inherit', outline: 'none', background: '#fff' }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          data-testid="form-submit-btn"
          type="submit"
          style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Submit
        </button>
      </div>
    </form>
  );
}

import { useState } from 'react';

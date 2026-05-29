'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
      } else {
        router.push('/');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  }

  return (
    <div
      data-testid="login-page"
      style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: '#DC2626',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path d="M3 3h4.5a2.5 2.5 0 010 5H3V3z" fill="white" strokeWidth="1" stroke="white" strokeLinejoin="round"/>
              <path d="M3 8h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 data-testid="login-heading" style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Sign in to Patch</h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>Discount Tire IT Support</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '28px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {error && (
            <div
              data-testid="login-error"
              style={{
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                color: '#DC2626',
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} data-testid="login-form">
            <div style={{ marginBottom: 16 }}>
              <label data-testid="email-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email
              </label>
              <input
                data-testid="email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@discounttire.com"
                style={{
                  width: '100%',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                  color: '#111827',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#DC2626')}
                onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label data-testid="password-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <input
                data-testid="password-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                  color: '#111827',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#DC2626')}
                onBlur={e => (e.target.style.borderColor = '#D1D5DB')}
              />
            </div>

            <button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#F87171' : '#DC2626',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '11px',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#6B7280' }}>
            Don&apos;t have an account?{' '}
            <Link data-testid="signup-link" href="/signup" style={{ color: '#DC2626', fontWeight: 600, textDecoration: 'none' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

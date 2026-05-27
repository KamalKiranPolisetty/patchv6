'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [generatedPw, setGeneratedPw] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setGeneratedPw('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'An error occurred during login. Please try again later.');
        return;
      }

      if (data.isNewUser && data.generatedPassword) {
        setGeneratedPw(data.generatedPassword);
        setInfo(data.message);
      } else {
        router.push('/');
      }
    } catch {
      setError('An error occurred during login. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      data-testid="login-page"
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
    >
      <div
        data-testid="login-card"
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 data-testid="login-heading" className="text-3xl font-bold text-gray-900 mb-1">
            Patch
          </h1>
          <p className="text-gray-500 text-sm">IT Support Assistant</p>
        </div>

        {error && (
          <div
            data-testid="login-error"
            className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
          >
            {error}
          </div>
        )}

        {info && (
          <div
            data-testid="login-info"
            className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm"
          >
            <p className="font-semibold mb-1">{info}</p>
            {generatedPw && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 mb-1">Your generated password:</p>
                <code
                  data-testid="generated-password"
                  className="block bg-white border border-amber-300 rounded px-3 py-2 font-mono text-base font-bold text-gray-900 select-all"
                >
                  {generatedPw}
                </code>
                <button
                  data-testid="continue-btn"
                  onClick={() => router.push('/')}
                  className="mt-4 w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Continue to Patch
                </button>
              </div>
            )}
          </div>
        )}

        {!generatedPw && (
          <form onSubmit={handleSubmit} data-testid="login-form" className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                data-testid="email-input"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                data-testid="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              data-testid="login-submit-btn"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg font-semibold transition-colors text-sm"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          New users get a generated password on first sign-in.
        </p>
      </div>
    </main>
  );
}

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successParam = searchParams.get('success');

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

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      router.push('/');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {successParam === '1' && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Account created! Please sign in.
        </div>
      )}

      <form onSubmit={handleSubmit} data-testid="login-form" className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="login-email-input"
            className="w-full px-4 py-2.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            placeholder="you@discounttire.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="login-password-input"
            className="w-full px-4 py-2.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p data-testid="login-error" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          data-testid="login-submit-btn"
          className="w-full py-2.5 px-4 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold text-sm transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          data-testid="login-signup-link"
          className="text-red-600 hover:text-red-700 font-medium"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, #FDF9F7 0%, #FAF0EC 100%)',
        }}
      >
        {/* Grid texture overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(220,38,38,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #DC2626 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-8">
            Discount Tire Information Center
          </p>

          {/* Patch logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Patch</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
            IT support,<br />resolved faster.
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-10 max-w-md">
            Patch guides Discount Tire associates through step-by-step troubleshooting — faster resolutions, less downtime.
          </p>

          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-bold text-red-600">&lt; 5 min</p>
              <p className="text-sm text-gray-500">avg. resolution</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">98%</p>
              <p className="text-sm text-gray-500">associate satisfaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Patch</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to Patch</h2>
          <p className="text-gray-500 mb-8 text-sm">
            Enter your credentials to continue.
          </p>

          <Suspense fallback={<div className="text-sm text-gray-400">Loading form...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Invalid email or password')
    } else {
      router.push('/')
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setGeneratedPassword('')
    setLoading(true)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Signup failed')
    } else {
      setGeneratedPassword(data.password)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50" data-testid="auth-page">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8" data-testid="auth-card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900" data-testid="auth-title">Patch</h1>
          <p className="text-slate-500 mt-1" data-testid="auth-subtitle">IT Support AI Assistant</p>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 mb-6" data-testid="mode-toggle">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setGeneratedPassword('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            data-testid="mode-login-btn"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setGeneratedPassword('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            data-testid="mode-signup-btn"
          >
            Sign Up
          </button>
        </div>

        {generatedPassword ? (
          <div className="text-center" data-testid="signup-success">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium mb-2">Account created successfully!</p>
              <p className="text-sm text-green-700 mb-3">Please save your generated password for future use:</p>
              <code className="bg-green-100 text-green-900 px-3 py-2 rounded font-mono text-lg block" data-testid="generated-password">
                {generatedPassword}
              </code>
            </div>
            <button
              onClick={() => { setMode('login'); setGeneratedPassword(''); setPassword('') }}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              data-testid="go-to-login-btn"
            >
              Go to Login
            </button>
          </div>
        ) : mode === 'login' ? (
          <form onSubmit={handleLogin} data-testid="login-form">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email" data-testid="email-label">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  required
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="email-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password" data-testid="password-label">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="password-input"
                />
              </div>
              {error && <p className="text-red-600 text-sm" data-testid="auth-error">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                data-testid="login-submit-btn"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} data-testid="signup-form">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="signup-email" data-testid="signup-email-label">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  required
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="signup-email-input"
                />
              </div>
              {error && <p className="text-red-600 text-sm" data-testid="auth-error">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                data-testid="signup-submit-btn"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

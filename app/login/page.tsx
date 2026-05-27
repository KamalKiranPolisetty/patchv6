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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Login failed')
        } else {
          router.push('/')
        }
      } else {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Signup failed')
        } else {
          setGeneratedPassword(data.password)
        }
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
    setGeneratedPassword('')
  }

  return (
    <div
      data-testid="login-page"
      className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Patch</h1>
          <p className="text-slate-500 mt-1 text-sm">IT Troubleshooting Assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {mode === 'login' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                data-testid="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {error && (
            <p data-testid="auth-error" className="text-red-600 text-sm">
              {error}
            </p>
          )}

          {generatedPassword && (
            <div
              data-testid="generated-password-box"
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <p className="text-green-800 text-sm font-medium mb-1">Account created!</p>
              <p className="text-green-700 text-sm mb-2">
                Your generated password is below. Please save it &mdash; you won&apos;t see it again.
              </p>
              <code
                data-testid="generated-password"
                className="block bg-green-100 text-green-900 rounded px-3 py-2 font-mono text-sm break-all"
              >
                {generatedPassword}
              </code>
            </div>
          )}

          <button
            type="submit"
            data-testid="auth-submit-btn"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            data-testid="auth-toggle-link"
            onClick={toggleMode}
            className="text-blue-600 hover:underline font-medium"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

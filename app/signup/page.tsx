"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed.");
      } else {
        router.push("/login?success=Account+created+successfully.+Please+sign+in.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#F5F5F5" }}
      data-testid="signup-page"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl p-8"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #E5E7EB" }}
        data-testid="signup-card"
      >
        <h1
          className="text-2xl font-bold text-center mb-6"
          style={{ color: "#111111" }}
          data-testid="signup-heading"
        >
          Create your account
        </h1>

        <form onSubmit={handleSubmit} data-testid="signup-form">
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
              style={{ color: "#111111" }}
              data-testid="signup-username-label"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #E5E7EB", color: "#111111", background: "#fff" }}
              placeholder="Your name"
              data-testid="signup-username-input"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1"
              style={{ color: "#111111" }}
              data-testid="signup-email-label"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #E5E7EB", color: "#111111", background: "#fff" }}
              placeholder="you@example.com"
              data-testid="signup-email-input"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
              style={{ color: "#111111" }}
              data-testid="signup-password-label"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #E5E7EB", color: "#111111", background: "#fff" }}
              placeholder="••••••••"
              data-testid="signup-password-input"
            />
          </div>

          {error && (
            <p
              className="mb-4 text-sm"
              style={{ color: "#DC2626" }}
              data-testid="signup-error-message"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-colors"
            style={{
              background: loading ? "#F87171" : "#DC2626",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            data-testid="signup-submit-btn"
          >
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "#6B7280" }}
          data-testid="signup-login-link-text"
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium hover:underline"
            style={{ color: "#DC2626" }}
            data-testid="signup-login-link"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

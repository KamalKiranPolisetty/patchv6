"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("success");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
      } else {
        router.push("/");
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
      data-testid="login-page"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl p-8"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #E5E7EB" }}
        data-testid="login-card"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "#DC2626" }}
            data-testid="login-logo"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L14.5 8.5H20L15.5 12L17.5 18L12 14.5L6.5 18L8.5 12L4 8.5H9.5L12 3Z" fill="white" />
            </svg>
          </div>
        </div>

        <h1
          className="text-2xl font-bold text-center mb-6"
          style={{ color: "#111111" }}
          data-testid="login-heading"
        >
          Sign in to Patch
        </h1>

        {successMessage && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: "#DCFCE7", color: "#166534" }}
            data-testid="login-success-message"
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="login-form">
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1"
              style={{ color: "#111111" }}
              data-testid="login-email-label"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{
                border: "1px solid #E5E7EB",
                color: "#111111",
                background: "#fff",
              }}
              placeholder="you@example.com"
              data-testid="login-email-input"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
              style={{ color: "#111111" }}
              data-testid="login-password-label"
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
              style={{
                border: "1px solid #E5E7EB",
                color: "#111111",
                background: "#fff",
              }}
              placeholder="••••••••"
              data-testid="login-password-input"
            />
          </div>

          {error && (
            <p
              className="mb-4 text-sm"
              style={{ color: "#DC2626" }}
              data-testid="login-error-message"
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
            data-testid="login-submit-btn"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "#6B7280" }}
          data-testid="login-signup-link-text"
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium hover:underline"
            style={{ color: "#DC2626" }}
            data-testid="login-signup-link"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PatchLogo from "@/components/PatchLogo";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signedUp = searchParams.get("signup") === "success";

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
        setError(data.error ?? "Login failed.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" data-testid="login-page">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #FAF8F5 0%, #F5EDE8 60%, #EFE0D8 100%)",
        }}
        data-testid="login-left-panel"
      >
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 30% 40%, rgba(204,0,0,0.04) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 40px),
              repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 40px)`,
          }}
        />

        {/* Top: Logo */}
        <div className="relative z-10">
          <PatchLogo size={44} showText textSize="text-2xl" />
        </div>

        {/* Middle: Hero content */}
        <div className="relative z-10 space-y-6 max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#CC0000]" data-testid="login-eyebrow">
            Discount Tire Information Center
          </p>
          <h1
            className="text-4xl font-semibold leading-tight text-gray-900"
            data-testid="login-hero-heading"
          >
            IT support, resolved faster.
          </h1>
          <p className="text-base text-gray-500 leading-relaxed">
            Patch guides Discount Tire store associates through IT issues step by step — using your knowledge base, so resolutions are fast and consistent.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-2" data-testid="login-stats">
            <div>
              <div className="text-2xl font-semibold text-gray-900">3 min</div>
              <div className="text-xs text-gray-400 mt-0.5">Avg. resolution time</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">94%</div>
              <div className="text-xs text-gray-400 mt-0.5">Self-service rate</div>
            </div>
          </div>
        </div>

        {/* Bottom: version note */}
        <div className="relative z-10">
          <p className="text-xs text-gray-400">Patch v1.0 · Discount Tire Internal</p>
        </div>
      </div>

      {/* Right panel */}
      <div
        className="flex-1 flex items-center justify-center bg-white p-8"
        data-testid="login-right-panel"
      >
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-2">
            <PatchLogo size={40} showText textSize="text-xl" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900" data-testid="login-form-heading">
              Sign in to Patch
            </h2>
            <p className="mt-1 text-sm text-gray-500">Enter your credentials to continue.</p>
          </div>

          {signedUp && (
            <div
              className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3"
              data-testid="signup-success-msg"
            >
              Account created! You can now sign in.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
                data-testid="login-email-label"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent transition"
                placeholder="you@discounttire.com"
                data-testid="login-email-input"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
                data-testid="login-password-label"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent transition"
                placeholder="••••••••"
                data-testid="login-password-input"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" data-testid="login-error-msg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#CC0000] hover:bg-[#AA0000] disabled:opacity-60 text-white font-semibold rounded-full py-3 text-sm transition-colors"
              data-testid="login-submit-btn"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500" data-testid="login-signup-link-text">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#CC0000] font-medium hover:underline"
              data-testid="login-signup-link"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

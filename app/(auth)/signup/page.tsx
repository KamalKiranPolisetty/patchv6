"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PatchLogo from "@/components/PatchLogo";

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
        setError(data.error ?? "Signup failed.");
        return;
      }
      router.push("/login?signup=success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" data-testid="signup-page">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #FAF8F5 0%, #F5EDE8 60%, #EFE0D8 100%)",
        }}
        data-testid="signup-left-panel"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 30% 40%, rgba(204,0,0,0.04) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 40px),
              repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 40px)`,
          }}
        />

        <div className="relative z-10">
          <PatchLogo size={44} showText textSize="text-2xl" />
        </div>

        <div className="relative z-10 space-y-6 max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#CC0000]" data-testid="signup-eyebrow">
            Discount Tire Information Center
          </p>
          <h1
            className="text-4xl font-semibold leading-tight text-gray-900"
            data-testid="signup-hero-heading"
          >
            IT support, resolved faster.
          </h1>
          <p className="text-base text-gray-500 leading-relaxed">
            Patch guides Discount Tire store associates through IT issues step by step — using your knowledge base, so resolutions are fast and consistent.
          </p>

          <div className="flex gap-8 pt-2" data-testid="signup-stats">
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

        <div className="relative z-10">
          <p className="text-xs text-gray-400">Patch v1.0 · Discount Tire Internal</p>
        </div>
      </div>

      {/* Right panel */}
      <div
        className="flex-1 flex items-center justify-center bg-white p-8"
        data-testid="signup-right-panel"
      >
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center mb-2">
            <PatchLogo size={40} showText textSize="text-xl" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900" data-testid="signup-form-heading">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-gray-500">Join the Discount Tire Information Center.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="signup-form">
            <div>
              <label
                htmlFor="signup-username"
                className="block text-sm font-medium text-gray-700 mb-1.5"
                data-testid="signup-username-label"
              >
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-full border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent transition"
                placeholder="Your name"
                data-testid="signup-username-input"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
                data-testid="signup-email-label"
              >
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent transition"
                placeholder="you@discounttire.com"
                data-testid="signup-email-input"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
                data-testid="signup-password-label"
              >
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent transition"
                placeholder="••••••••"
                data-testid="signup-password-input"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" data-testid="signup-error-msg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#CC0000] hover:bg-[#AA0000] disabled:opacity-60 text-white font-semibold rounded-full py-3 text-sm transition-colors"
              data-testid="signup-submit-btn"
            >
              {loading ? "Creating account…" : "Sign Up"}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500" data-testid="signup-login-link-text">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#CC0000] font-medium hover:underline"
              data-testid="signup-login-link"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

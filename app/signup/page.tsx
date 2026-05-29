"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = "Username is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address.";
    else if (email.length > 255) e.email = "Email must be under 255 characters.";
    if (!password) e.password = "Password is required.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.error || "Something went wrong." });
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div data-testid="signup-page" className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">Patch</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h1 data-testid="signup-heading" className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">Join the Discount Tire Information Center</p>

          <form data-testid="signup-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-username" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Username
              </label>
              <input
                id="signup-username"
                data-testid="signup-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${errors.username ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
              />
              {errors.username && <p data-testid="signup-username-error" className="text-xs text-red-600 mt-1">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                id="signup-email"
                data-testid="signup-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${errors.email ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
              />
              {errors.email && <p data-testid="signup-email-error" className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                id="signup-password"
                data-testid="signup-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${errors.password ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-red-500 focus:ring-red-500"}`}
              />
              {errors.password && <p data-testid="signup-password-error" className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            {errors.general && (
              <p data-testid="signup-error" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errors.general}
              </p>
            )}

            <button
              type="submit"
              data-testid="signup-submit-btn"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" data-testid="login-link" className="text-red-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

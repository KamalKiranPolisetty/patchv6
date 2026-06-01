"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/Label";

export function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create account.");
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form data-testid="signup-form" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <FieldLabel htmlFor="username" required>
          Username
        </FieldLabel>
        <input
          id="username"
          data-testid="signup-username-input"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-patch-red/30 focus:border-patch-red"
          placeholder="janedoe"
        />
      </div>
      <div>
        <FieldLabel htmlFor="email" required>
          Email
        </FieldLabel>
        <input
          id="email"
          data-testid="signup-email-input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-patch-red/30 focus:border-patch-red"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <FieldLabel htmlFor="password" required>
          Password
        </FieldLabel>
        <input
          id="password"
          data-testid="signup-password-input"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-patch-red/30 focus:border-patch-red"
          placeholder="Create a password"
        />
      </div>

      {error ? (
        <div
          data-testid="signup-error"
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 text-red-800 text-[13px] px-3 py-2"
        >
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        data-testid="signup-submit-btn"
        variant="primary"
        size="lg"
        fullWidth
        disabled={submitting}
      >
        {submitting ? "Creating account…" : "Sign Up"}
      </Button>
    </form>
  );
}

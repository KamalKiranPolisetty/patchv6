import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { createUser, findUserByEmail, findUserById, type User } from "@/lib/db";

const SESSION_COOKIE = "patch_session";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function signUp(input: {
  username: string;
  email: string;
  password: string;
}): Promise<{ user: User; sessionToken: string } | { error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!input.username.trim()) return { error: "Username is required." };
  if (!input.password) return { error: "Password is required." };

  const existing = await findUserByEmail(email);
  if (existing) {
    return { error: "An account with that email already exists." };
  }
  const user = await createUser({
    username: input.username.trim(),
    email,
    password: hashPassword(input.password),
  });
  const sessionToken = makeSessionToken(user.id);
  return { user, sessionToken };
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<{ user: User; sessionToken: string } | { error: string }> {
  const email = input.email.trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user) return { error: "Invalid email or password." };
  if (user.password !== hashPassword(input.password)) {
    return { error: "Invalid email or password." };
  }
  const sessionToken = makeSessionToken(user.id);
  return { user, sessionToken };
}

function makeSessionToken(userId: string): string {
  const nonce = randomBytes(12).toString("hex");
  return `${userId}.${nonce}`;
}

export function parseSessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [userId] = token.split(".");
  return userId || null;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const userId = parseSessionToken(token);
  if (!userId) return null;
  return findUserById(userId);
}

export async function getCurrentUserId(): Promise<string | null> {
  const u = await getCurrentUser();
  return u?.id ?? null;
}

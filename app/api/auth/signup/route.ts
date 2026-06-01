import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, signUp } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { username?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const username = (body.username ?? "").trim();
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  if (!username || !email || !password) {
    return NextResponse.json(
      { error: "Username, email, and password are required." },
      { status: 400 },
    );
  }
  const result = await signUp({ username, email, password });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  await setSessionCookie(result.sessionToken);
  return NextResponse.json({
    user: { id: result.user.id, username: result.user.username, email: result.user.email },
  });
}

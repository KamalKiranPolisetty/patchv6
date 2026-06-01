import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, signIn } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  const result = await signIn({ email, password });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  await setSessionCookie(result.sessionToken);
  return NextResponse.json({
    user: { id: result.user.id, username: result.user.username, email: result.user.email },
  });
}

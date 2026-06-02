import { NextResponse } from 'next/server';
import { COOKIE_NAME, getSessionCookieOptions } from '@/lib/session';

export async function POST() {
  const res = NextResponse.json({ success: true });
  const cookieOptions = getSessionCookieOptions(0);
  res.cookies.set(COOKIE_NAME, '', cookieOptions);
  return res;
}

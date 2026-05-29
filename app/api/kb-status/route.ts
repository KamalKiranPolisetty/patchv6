import { NextResponse } from 'next/server';
import { checkKBAvailable } from '@/lib/kb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'VDI';
  const available = checkKBAvailable(category);
  return NextResponse.json({ available });
}

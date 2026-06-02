import { NextRequest, NextResponse } from 'next/server';
import { checkKbFile } from '@/lib/kb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || '';
  const available = checkKbFile(category);
  return NextResponse.json({ available });
}

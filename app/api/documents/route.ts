import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const KnowledgeBase = (await import('@/lib/models/KnowledgeBase')).default;

  const categories = await KnowledgeBase.distinct('category');

  return NextResponse.json({ categories });
}

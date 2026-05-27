import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

function getCategoryMetadata(category: string) {
  switch (category) {
    case 'VDI':
      return { type: 'Software', priority: 'P5', urgency: 'U3', impact: 'I3' };
    case 'Printer':
      return { type: 'Software', priority: 'P5', urgency: 'U3', impact: 'I3' };
    case 'Scanner':
      return { type: 'Hardware', priority: 'P5', urgency: 'U3', impact: 'I3' };
    default:
      return { type: 'Software', priority: 'P5', urgency: 'U3', impact: 'I3' };
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { category, firstMessage } = await request.json();

  await connectToDatabase();
  const PatchTransaction = (await import('@/lib/models/PatchTransaction')).default;

  const incidentId = `INC-${Date.now()}`;
  const metadata = getCategoryMetadata(category);

  const incident = await PatchTransaction.create({
    incidentId,
    userId: decoded.userId,
    status: 'Open',
    category,
    metadata,
    conversation: [{ role: 'user', content: firstMessage, timestamp: new Date() }],
    timeline: [{ event: 'Incident Created', timestamp: new Date(), details: `Category: ${category}` }],
    documents: [],
  });

  return NextResponse.json(incident, { status: 201 });
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const PatchTransaction = (await import('@/lib/models/PatchTransaction')).default;

  const incidents = await PatchTransaction.find({ userId: decoded.userId }).sort({ createdAt: -1 });

  return NextResponse.json(incidents);
}

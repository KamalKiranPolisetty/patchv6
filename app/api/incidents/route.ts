import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Incident from '@/models/Incident';
import { getSession } from '@/lib/auth';

function generateIncidentId(): string {
  const num = Math.floor(Math.random() * 9000000) + 1000000;
  return `INC${num}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const incidents = await Incident.find({ userId: session.userId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ incidents });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { category, kbReferences } = await request.json();

  await connectDB();

  const incident = await Incident.create({
    incidentId: generateIncidentId(),
    userId: session.userId,
    status: 'Open',
    category: category || '',
    kbReferences: kbReferences || [],
    timeline: [{ status: 'Open', timestamp: new Date(), actor: 'Patch' }],
    conversationHistory: [],
  });

  return NextResponse.json({ incident });
}

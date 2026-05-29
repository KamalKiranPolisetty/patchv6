import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Incident from '@/models/Incident';
import { getSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const incident = await Incident.findOne({ incidentId: id, userId: session.userId }).lean();
  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ incident });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  await connectDB();

  const incident = await Incident.findOne({ incidentId: id, userId: session.userId });
  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.conversationHistory) {
    incident.conversationHistory = body.conversationHistory;
  }

  if (body.appendMessage) {
    incident.conversationHistory.push(body.appendMessage);
  }

  if (body.status && body.status !== incident.status) {
    incident.status = body.status;
    incident.timeline.push({
      status: body.status,
      timestamp: new Date(),
      actor: body.status === 'Escalated' ? 'Escalation Team' : 'Patch',
    });
    incident.lastUpdatedBy = body.status === 'Escalated' ? 'Escalation Team' : 'Patch';
  }

  if (body.escalationData) {
    incident.escalationData = body.escalationData;
  }

  if (body.feedback) {
    incident.feedback = { ...body.feedback, submittedAt: new Date() };
  }

  if (body.category) incident.category = body.category;
  if (body.kbReferences) incident.kbReferences = body.kbReferences;

  await incident.save();
  return NextResponse.json({ incident });
}

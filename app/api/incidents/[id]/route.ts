import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await connectToDatabase();
  const PatchTransaction = (await import('@/lib/models/PatchTransaction')).default;

  const incident = await PatchTransaction.findOne({ incidentId: id });
  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(incident);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status, escalationDetails, resolutionDetails, conversationIndex, feedback } =
    await request.json();

  await connectToDatabase();
  const PatchTransaction = (await import('@/lib/models/PatchTransaction')).default;

  const incident = await PatchTransaction.findOne({ incidentId: id });
  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (status) {
    incident.status = status;
    incident.timeline.push({ event: `Status Updated to ${status}`, timestamp: new Date(), details: '' });
  }

  if (escalationDetails) {
    incident.escalationDetails = escalationDetails;
  }

  if (resolutionDetails) {
    incident.resolutionDetails = resolutionDetails;
  }

  if (conversationIndex !== undefined && feedback !== undefined) {
    if (incident.conversation[conversationIndex]) {
      incident.conversation[conversationIndex].feedback = {
        rating: feedback.rating,
        timestamp: new Date(),
      };
    }
  }

  await incident.save();

  return NextResponse.json(incident);
}

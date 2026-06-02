import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { connectDB } from '@/lib/mongodb';
import Incident from '@/models/Incident';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectDB();
    const body = await req.json() as { rating?: number; comment?: string };
    const { rating, comment } = body;

    const incident = await Incident.findOne({ incidentId: id, email: session.email });
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found.' }, { status: 404 });
    }

    incident.feedback = {
      rating,
      comment: comment || '',
      submittedAt: new Date(),
    };

    await incident.save();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Feedback error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

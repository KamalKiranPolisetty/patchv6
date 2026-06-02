import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { connectDB } from '@/lib/mongodb';
import Incident from '@/models/Incident';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectDB();
    const incident = await Incident.findOne({ incidentId: id, email: session.email }).lean();
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found.' }, { status: 404 });
    }
    return NextResponse.json({ incident });
  } catch (err) {
    console.error('Get incident error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await req.json() as Record<string, unknown>;

    const incident = await Incident.findOne({ incidentId: id, email: session.email });
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found.' }, { status: 404 });
    }

    // Apply allowed updates
    const allowedFields = ['storeNumber', 'priority', 'urgency', 'impact', 'history'];
    for (const field of allowedFields) {
      if (field in body) {
        (incident as Record<string, unknown>)[field] = body[field];
      }
    }

    incident.lastupdatedby = session.username;
    await incident.save();

    return NextResponse.json({ success: true, incident });
  } catch (err) {
    console.error('Patch incident error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

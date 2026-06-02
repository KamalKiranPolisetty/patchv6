import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { connectDB } from '@/lib/mongodb';
import Incident from '@/models/Incident';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const incidents = await Incident.find({ email: session.email })
      .sort({ updatedAt: -1 })
      .select('incidentId category status createdAt updatedAt priority urgency impact')
      .lean();

    return NextResponse.json({ incidents });
  } catch (err) {
    console.error('Incidents list error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

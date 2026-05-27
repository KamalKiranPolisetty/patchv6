import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import PatchTransaction from '@/models/PatchTransaction';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();
    const incident = await PatchTransaction.findOne({ incidentId: id, userId: user.userId }).lean();
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found.' }, { status: 404 });
    }

    return NextResponse.json({ incident });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch incident.' }, { status: 500 });
  }
}

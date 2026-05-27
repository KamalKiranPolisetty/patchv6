import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import PatchTransaction from '@/models/PatchTransaction';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ incidentId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { incidentId } = await params;
    await connectToDatabase();
    const transaction = await PatchTransaction.findOne({ incidentId, userId: user.userId });
    if (!transaction) {
      return NextResponse.json({ error: 'Incident not found.' }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch history.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import PatchTransaction from '@/models/PatchTransaction';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    await connectToDatabase();
    const query: Record<string, unknown> = { userId: user.userId };
    if (status && status !== 'All') {
      query.status = status;
    }

    const incidents = await PatchTransaction.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ incidents });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch incidents.' }, { status: 500 });
  }
}

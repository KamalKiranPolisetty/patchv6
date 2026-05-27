import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import PatchTransaction from '@/models/PatchTransaction';
import { getAuthUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { rating } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }

    await connectToDatabase();
    const incident = await PatchTransaction.findOneAndUpdate(
      { incidentId: id, userId: user.userId },
      { feedbackRating: rating },
      { new: true }
    );

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save feedback.' }, { status: 500 });
  }
}

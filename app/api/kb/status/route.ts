import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import KnowledgeBase from '@/models/KnowledgeBase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const vdiDoc = await KnowledgeBase.findOne({ category: 'VDI' });
    const printerDoc = await KnowledgeBase.findOne({ category: 'Printer' });

    return NextResponse.json({
      VDI: !!vdiDoc,
      Printer: !!printerDoc,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch KB status.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { connectToDatabase } from '@/lib/mongodb';
import KnowledgeBase from '@/models/KnowledgeBase';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const categoryRaw = formData.get('category') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!categoryRaw || !['VDI', 'Printer'].includes(categoryRaw)) {
      return NextResponse.json({ error: 'Valid category (VDI or Printer) is required.' }, { status: 400 });
    }
    if (!file.name.endsWith('.docx')) {
      return NextResponse.json({ error: 'Only .docx files are supported.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    const extractedText = result.value;

    await connectToDatabase();
    await KnowledgeBase.create({
      category: categoryRaw as 'VDI' | 'Printer',
      fileName: file.name,
      extractedText,
      uploadDate: new Date(),
      userId: user.userId,
    });

    return NextResponse.json({ success: true, message: 'Document uploaded successfully.' });
  } catch {
    return NextResponse.json({ error: 'Failed to upload document. Please try again.' }, { status: 500 });
  }
}

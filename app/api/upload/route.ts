import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mammoth from 'mammoth';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decoded = verifyToken(token);
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const category = formData.get('category') as string;

  if (!file || !file.name.endsWith('.docx')) {
    return NextResponse.json({ error: 'Only .docx files are supported' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await mammoth.extractRawText({ buffer });

  await connectToDatabase();
  const KnowledgeBase = (await import('@/lib/models/KnowledgeBase')).default;

  const document = await KnowledgeBase.create({
    documentId: `DOC-${Date.now()}`,
    category,
    fileName: file.name,
    extractedText: result.value,
    uploadedBy: decoded.userId,
    createdAt: new Date(),
  });

  return NextResponse.json(document, { status: 201 });
}

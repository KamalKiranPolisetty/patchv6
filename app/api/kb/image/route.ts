import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename') || '';

  if (!filename || filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Invalid filename.' }, { status: 400 });
  }

  const imgPath = path.join(process.cwd(), 'knowledge_base', 'images', filename);

  try {
    if (!fs.existsSync(imgPath)) {
      return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
    }

    const buffer = fs.readFileSync(imgPath);
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: { 'Content-Type': contentType },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to read image.' }, { status: 500 });
  }
}

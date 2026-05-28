import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;

    if (!file || !category) {
      return NextResponse.json({ error: "File and category are required" }, { status: 400 });
    }

    if (!file.name.endsWith(".docx")) {
      return NextResponse.json({ error: "Only .docx files are supported" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    const extractedText = result.value;

    const db = await getDb();
    await db.collection("KnowledgeBase").insertOne({
      category,
      fileName: file.name,
      extractedText,
      uploadDate: new Date(),
      userId: new ObjectId(session.id),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const db = await getDb();
  const query = category ? { category } : {};
  const docs = await db.collection("KnowledgeBase").find(query, { projection: { category: 1, fileName: 1, uploadDate: 1 } }).toArray();

  return NextResponse.json({ docs });
}

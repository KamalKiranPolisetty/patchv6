import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string;

    if (!file || !category) {
      return NextResponse.json({ error: "File and category are required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { value: text } = await mammoth.extractRawText({ buffer });

    const db = await getDb();
    await db.collection("Documents").updateOne(
      { category },
      {
        $set: {
          category,
          filename: file.name,
          content: text,
          uploadedAt: new Date(),
          uploadedBy: session.userId,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to upload document." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDb();
    const docs = await db.collection("Documents").find({}, { projection: { content: 0 } }).toArray();
    return NextResponse.json({ documents: docs.map((d) => ({ ...d, _id: d._id.toString() })) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch documents." }, { status: 500 });
  }
}

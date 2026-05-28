import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { rating } = await req.json();

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("PatchTransactions").updateOne(
    { _id: new ObjectId(id) },
    { $set: { feedbackRating: rating, feedbackTimestamp: new Date() } }
  );

  return NextResponse.json({ success: true });
}

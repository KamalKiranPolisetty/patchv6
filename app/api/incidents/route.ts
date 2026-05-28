import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const incidents = await db
    .collection("PatchTransactions")
    .find({ userId: new ObjectId(session.id) })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ incidents });
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await getDb();
  const incident = await db.collection("PatchTransactions").findOne({ _id: new ObjectId(id) });

  if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ incident });
}

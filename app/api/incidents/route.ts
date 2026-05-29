import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  await connectDB();

  const query: Record<string, unknown> = { userId: new Types.ObjectId(session.userId) };
  if (status && status !== "All") query.status = status;

  const incidents = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .select("incidentId status category subCategory createdAt updatedAt priority urgency impact")
    .lean();

  return NextResponse.json({ incidents });
}

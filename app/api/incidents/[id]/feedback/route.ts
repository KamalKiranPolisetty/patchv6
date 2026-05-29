import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { Types } from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { rating, comments } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  }

  await connectDB();

  const incident = await Transaction.findOne({
    incidentId: id,
    userId: new Types.ObjectId(session.userId),
  });

  if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });

  incident.feedback = { rating, comments: comments || "", submittedAt: new Date() };
  await incident.save();

  return NextResponse.json({ success: true });
}

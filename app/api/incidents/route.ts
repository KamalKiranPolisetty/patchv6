import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/lib/models/transaction";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const incidents = await Transaction.find({ userId: session.userId })
    .sort({ createdAt: -1 })
    .select("incidentId status category createdAt updatedAt escalationDetails resolutionDetails feedback")
    .lean();

  return NextResponse.json({ incidents });
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/lib/models/transaction";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const incident = await Transaction.findOne({
    incidentId: id,
    userId: session.userId,
  }).lean();

  if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ incident });
}

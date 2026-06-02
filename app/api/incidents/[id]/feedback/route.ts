import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/lib/models/transaction";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: { stars: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { stars, comment = "" } = body;
  if (typeof stars !== "number" || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "stars must be 1–5" }, { status: 400 });
  }

  await connectDB();

  const result = await Transaction.findOneAndUpdate(
    { incidentId: id, userId: session.userId },
    { $set: { feedback: { stars, comment, submittedAt: new Date() } } },
    { new: true }
  );

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

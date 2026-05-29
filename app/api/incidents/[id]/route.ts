import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await getDb();

  try {
    const incident = await db.collection("PatchTransactions").findOne({ _id: new ObjectId(id) });
    if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...incident, _id: incident._id.toString() });
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const db = await getDb();

  const setFields: Record<string, unknown> = { updatedAt: new Date() };
  const pushFields: Record<string, unknown> = {};

  if (body.status) {
    setFields.status = body.status;
    pushFields.timeline = { status: body.status, timestamp: new Date(), actor: "Patch" };
  }

  if (body.feedback) {
    setFields.feedback = body.feedback;
  }

  if (body.escalationDetails) {
    setFields.escalationDetails = body.escalationDetails;
  }

  if (body.resolutionDetails) {
    setFields.resolutionDetails = body.resolutionDetails;
  }

  const updateOp: Record<string, unknown> = { $set: setFields };
  if (Object.keys(pushFields).length > 0) {
    updateOp.$push = pushFields;
  }

  try {
    await db.collection("PatchTransactions").updateOne(
      { _id: new ObjectId(id) },
      updateOp
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

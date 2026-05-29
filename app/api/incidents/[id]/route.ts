import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const db = await getDb();

  let incident;
  if (ObjectId.isValid(id)) {
    incident = await db.collection("patch_transactions").findOne({ _id: new ObjectId(id), userId: user.userId });
  }
  if (!incident) {
    incident = await db.collection("patch_transactions").findOne({ incidentId: id, userId: user.userId });
  }
  if (!incident) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(incident);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const db = await getDb();

  const updateFields: Record<string, unknown> = { updatedAt: new Date() };

  if (body.status) updateFields.status = body.status;
  if (body.escalation) {
    updateFields.escalation = body.escalation;
    updateFields.lastUpdatedBy = "Escalation Team";
  }
  if (body.resolution) {
    updateFields.resolution = body.resolution;
    updateFields.lastUpdatedBy = "Patch";
  }
  if (body.feedback) updateFields.feedback = body.feedback;
  if (body.pushHistory) {
    // pushHistory is an array of entries to push
  }

  const filter: Record<string, unknown> = { userId: user.userId };
  let pushOp: Record<string, unknown> = {};

  if (ObjectId.isValid(id)) {
    filter._id = new ObjectId(id);
  } else {
    filter.incidentId = id;
  }

  if (body.pushHistory && Array.isArray(body.pushHistory)) {
    pushOp = { history: { $each: body.pushHistory } };
  }

  const updateOp: Record<string, unknown> = { $set: updateFields };
  if (Object.keys(pushOp).length > 0) {
    updateOp.$push = pushOp;
  }

  const result = await db.collection("patch_transactions").findOneAndUpdate(
    filter,
    updateOp,
    { returnDocument: "after" }
  );

  if (!result) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(result);
}

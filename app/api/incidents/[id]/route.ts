import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await getDb();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: Record<string, any>;
  try {
    query = { _id: new ObjectId(id), userId: session.userId };
  } catch {
    query = { incidentNumber: id, userId: session.userId };
  }

  const incident = await db.collection("Patch Transactions").findOne(query);
  if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...incident, _id: incident._id.toString() });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const db = await getDb();
  const now = new Date();

  if (body.appendMessage) {
    const msg = { ...body.appendMessage, timestamp: now };
    await db.collection("Patch Transactions").updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { conversationHistory: msg } as never,
        $set: { updatedAt: now },
      }
    );
  }

  if (body.status) {
    await db.collection("Patch Transactions").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { status: body.status, updatedAt: now },
        $push: {
          timeline: { event: body.status, timestamp: now },
        } as never,
      }
    );
  }

  if (body.escalationDetails) {
    await db.collection("Patch Transactions").updateOne(
      { _id: new ObjectId(id) },
      { $set: { escalationDetails: { ...body.escalationDetails, timestamp: now }, updatedAt: now } }
    );
  }

  if (body.resolutionDetails) {
    await db.collection("Patch Transactions").updateOne(
      { _id: new ObjectId(id) },
      { $set: { resolutionDetails: { ...body.resolutionDetails, timestamp: now }, updatedAt: now } }
    );
  }

  if (body.feedback) {
    await db.collection("Patch Transactions").updateOne(
      { _id: new ObjectId(id) },
      { $set: { feedback: body.feedback, updatedAt: now } }
    );
  }

  if (body.kbReferences) {
    await db.collection("Patch Transactions").updateOne(
      { _id: new ObjectId(id) },
      { $set: { kbReferences: body.kbReferences, updatedAt: now } }
    );
  }

  if (body.currentState !== undefined) {
    await db.collection("Patch Transactions").updateOne(
      { _id: new ObjectId(id) },
      { $set: { currentState: body.currentState, updatedAt: now } }
    );
  }

  const updated = await db
    .collection("Patch Transactions")
    .findOne({ _id: new ObjectId(id) });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...updated, _id: updated._id.toString() });
}

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getDb();
    const incident = await db.collection("Patch Transactions").findOne({ _id: new ObjectId(id) });
    if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ incident: { ...incident, _id: incident._id.toString(), userId: incident.userId.toString() } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch incident." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const db = await getDb();
    const now = new Date();

    const updateDoc: Record<string, unknown> = { updatedAt: now };
    const pushDoc: Record<string, unknown> = {};

    if (body.addMessage) {
      pushDoc["conversationHistory"] = { ...body.addMessage, timestamp: now };
    }

    if (body.status) {
      const incident = await db.collection("Patch Transactions").findOne({ _id: new ObjectId(id) });
      if (incident && incident.status !== body.status) {
        updateDoc["status"] = body.status;
        pushDoc["timeline"] = { status: body.status, timestamp: now, actor: "Patch" };
      }
    }

    if (body.escalationDetails) {
      updateDoc["escalationDetails"] = { ...body.escalationDetails, timestamp: now };
    }

    if (body.resolutionDetails) {
      updateDoc["resolutionDetails"] = { ...body.resolutionDetails, timestamp: now };
    }

    if (body.feedbackRating !== undefined) {
      updateDoc["feedbackRating"] = body.feedbackRating;
    }

    const update: Record<string, unknown> = { $set: updateDoc };
    if (Object.keys(pushDoc).length > 0) {
      update["$push"] = pushDoc;
    }

    await db.collection("Patch Transactions").updateOne({ _id: new ObjectId(id) }, update);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update incident." }, { status: 500 });
  }
}

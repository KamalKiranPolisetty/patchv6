import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

const CATEGORY_METADATA: Record<string, { type: string; priority: number; urgency: number; impact: number }> = {
  VDI: { type: "Software / VDI", priority: 5, urgency: 3, impact: 3 },
  Printer: { type: "Software / Printer", priority: 5, urgency: 3, impact: 3 },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { category, firstMessage } = await req.json();
    const meta = CATEGORY_METADATA[category] || { type: "Software", priority: 5, urgency: 3, impact: 3 };

    const db = await getDb();
    const now = new Date();
    const result = await db.collection("Patch Transactions").insertOne({
      userId: new ObjectId(session.userId),
      status: "Open",
      category: category || null,
      priority: meta.priority,
      urgency: meta.urgency,
      impact: meta.impact,
      type: meta.type,
      conversationHistory: firstMessage
        ? [{ role: "user", content: firstMessage, timestamp: now }]
        : [],
      timeline: [{ status: "Open", timestamp: now, actor: "Patch" }],
      feedbackRating: null,
      escalationDetails: null,
      resolutionDetails: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ incidentId: result.insertedId.toString() });
  } catch {
    return NextResponse.json({ error: "Failed to create incident." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDb();
    const incidents = await db
      .collection("Patch Transactions")
      .find({ userId: new ObjectId(session.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ incidents: incidents.map((i) => ({ ...i, _id: i._id.toString(), userId: i.userId.toString() })) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch incidents." }, { status: 500 });
  }
}

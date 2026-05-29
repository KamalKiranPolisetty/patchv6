import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

function generateIncidentNumber(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `INC${num}`;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const db = await getDb();
  const query: Record<string, string> = { userId: session.userId };
  if (status && status !== "All") query.status = status;

  const incidents = await db
    .collection("Patch Transactions")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  const serialized = incidents.map((inc) => ({
    ...inc,
    _id: inc._id.toString(),
  }));

  return NextResponse.json(serialized);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, firstMessage } = await req.json();

  const db = await getDb();
  const now = new Date();
  const doc = {
    incidentNumber: generateIncidentNumber(),
    userId: session.userId,
    username: session.username,
    status: "Open",
    category: category || "General",
    conversationHistory: firstMessage
      ? [{ role: "user", content: firstMessage, timestamp: now }]
      : [],
    kbReferences: [],
    escalationDetails: null,
    resolutionDetails: null,
    feedback: null,
    timeline: [{ event: "Opened", timestamp: now }],
    currentState: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("Patch Transactions").insertOne(doc);
  return NextResponse.json({ _id: result.insertedId.toString(), ...doc });
}

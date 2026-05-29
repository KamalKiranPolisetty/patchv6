import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import type { Incident } from "@/lib/types";

function generateIncidentId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INC-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { category, firstMessage, kbContext } = await req.json();

  const db = await getDb();
  const incident: Incident = {
    incidentId: generateIncidentId(),
    userId: user.userId,
    userEmail: user.email,
    username: user.username,
    category: category || "General",
    status: "Open",
    history: firstMessage
      ? [{ role: "user", content: firstMessage, timestamp: new Date() }]
      : [],
    kbContext: kbContext || [],
    escalation: null,
    resolution: null,
    feedback: null,
    lastUpdatedBy: "Patch",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("patch_transactions").insertOne(incident);
  return NextResponse.json({ ...incident, _id: result.insertedId }, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const db = await getDb();
  const incidents = await db
    .collection("patch_transactions")
    .find({ userId: user.userId })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(incidents);
}

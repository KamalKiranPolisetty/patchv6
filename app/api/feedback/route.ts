import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { incidentId, rating, comment } = await req.json();

  if (!incidentId || !rating) {
    return NextResponse.json({ error: "incidentId and rating are required." }, { status: 400 });
  }

  const db = await getDb();

  const filter: Record<string, unknown> = { userId: user.userId };
  if (ObjectId.isValid(incidentId)) {
    filter._id = new ObjectId(incidentId);
  } else {
    filter.incidentId = incidentId;
  }

  const result = await db.collection("patch_transactions").findOneAndUpdate(
    filter,
    {
      $set: {
        feedback: { rating, comment: comment || "", submittedAt: new Date() },
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!result) return NextResponse.json({ error: "Incident not found." }, { status: 404 });

  return NextResponse.json({ message: "Feedback saved." });
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getIncidentById, setFeedback } from "@/lib/db";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/incidents/[id]/feedback">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const incident = await getIncidentById(id);
  if (!incident || incident.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (incident.status !== "Escalated" && incident.status !== "Resolved") {
    return NextResponse.json(
      { error: "Feedback is only allowed for escalated or resolved incidents." },
      { status: 400 },
    );
  }

  let body: { rating?: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  }
  const comment = (body.comment ?? "").toString().slice(0, 2000);

  const updated = await setFeedback(incident.incidentId, {
    rating,
    comment,
    timestamp: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "Failed to save feedback." }, { status: 500 });
  return NextResponse.json({ incident: updated });
}

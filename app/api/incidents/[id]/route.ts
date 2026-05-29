import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { Types } from "mongoose";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const incident = await Transaction.findOne({
    incidentId: id,
    userId: new Types.ObjectId(session.userId),
  }).lean();

  if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ incident });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  await connectDB();

  const incident = await Transaction.findOne({
    incidentId: id,
    userId: new Types.ObjectId(session.userId),
  });

  if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.status && body.status !== incident.status) {
    incident.status = body.status;
    incident.timeline.push({
      status: body.status,
      timestamp: new Date(),
      actor: "Patch",
    });
  }

  if (body.resolutionDetails) {
    incident.resolutionDetails = {
      timestamp: new Date(),
      resolvedBy: "Patch",
      summary: body.resolutionDetails.summary,
    };
  }

  await incident.save();
  return NextResponse.json({ success: true });
}

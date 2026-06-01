import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getIncidentsByUser } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const incidents = await getIncidentsByUser(user.id);
  return NextResponse.json({ incidents });
}

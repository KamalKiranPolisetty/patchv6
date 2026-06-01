import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getIncidentById } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/incidents/[id]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const incident = await getIncidentById(id);
  if (!incident || incident.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ incident });
}

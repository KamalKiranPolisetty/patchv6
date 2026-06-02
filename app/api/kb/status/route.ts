import { NextRequest, NextResponse } from "next/server";
import { getKBStatus } from "@/lib/kb";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? "vdi";
  const available = await getKBStatus(category);
  return NextResponse.json({ available });
}

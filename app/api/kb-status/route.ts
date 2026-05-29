import { NextResponse } from "next/server";
import { kbFileExists, ensureKbDirs } from "@/lib/kb";

export async function GET() {
  ensureKbDirs();
  const vdiAvailable = kbFileExists("vdi");
  return NextResponse.json({ vdiAvailable });
}

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  // Sanitize: strip any path traversal
  const safe = path.basename(filename);
  const filePath = path.join(process.cwd(), "knowledge_base", "images", safe);

  try {
    const buf = await readFile(filePath);
    const ext = safe.split(".").pop()?.toLowerCase() ?? "png";
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };
    const contentType = mimeTypes[ext] ?? "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    console.error(`[kb/images] Missing image: ${safe}`);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}

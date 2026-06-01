import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { ensureKBStructure } from "@/lib/kb";

const ALLOWED = /\.(png|jpg|jpeg|gif|webp|svg)$/i;

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/kb-images/[filename]">) {
  await ensureKBStructure();
  const { filename } = await ctx.params;

  // Strip any directory traversal — only allow bare filenames.
  const safe = path.basename(filename);
  if (!ALLOWED.test(safe)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  const filepath = path.join(process.cwd(), "knowledge_base", "images", safe);
  try {
    const data = await fs.readFile(filepath);
    const ext = path.extname(safe).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".gif"
            ? "image/gif"
            : ext === ".webp"
              ? "image/webp"
              : ext === ".svg"
                ? "image/svg+xml"
                : "application/octet-stream";
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    // Per the spec: missing image files are logged but should not crash.
    console.warn(`[kb-images] requested image not found: ${safe}`);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}

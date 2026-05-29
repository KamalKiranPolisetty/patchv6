import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id || session.user.email;
  const db = await getDb();
  const status = req.nextUrl.searchParams.get("status");
  const query: Record<string, unknown> = { userId };
  if (status && status !== "All") query.status = status;

  const incidents = await db.collection("PatchTransactions")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(incidents.map(i => ({
    ...i,
    _id: i._id.toString(),
  })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = await getDb();
  const result = await db.collection("PatchTransactions").insertOne({
    ...body,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 });
}

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = await getDb()
  const incident = await db.collection('PatchTransactions').findOne({ incidentId: id })
  if (!incident) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(incident)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const db = await getDb()

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (body.feedbackRating !== undefined) {
    updates.feedbackRating = body.feedbackRating
    updates.feedbackTimestamp = new Date()
  }

  await db.collection('PatchTransactions').updateOne({ incidentId: id }, { $set: updates })
  return Response.json({ success: true })
}

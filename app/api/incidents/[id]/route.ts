import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Incident from '@/lib/models/Incident'
import { getSession } from '@/lib/session'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await connectDB()
    const incident = await Incident.findOne({ incidentId: id, userId: session.userId })
    if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ incident })
  } catch (err) {
    console.error('Get incident error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await req.json()
    await connectDB()

    const incident = await Incident.findOne({ incidentId: id, userId: session.userId })
    if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (body.conversationHistory) {
      incident.conversationHistory = body.conversationHistory
    }

    if (body.status && body.status !== incident.status) {
      incident.status = body.status
      incident.timeline.push({
        status: body.status,
        timestamp: new Date(),
        actor: body.actor || 'Patch',
      })
    }

    if (body.category) incident.category = body.category
    if (body.escalationReason) incident.escalationReason = body.escalationReason
    if (body.assignedGroup) incident.assignedGroup = body.assignedGroup

    await incident.save()
    return NextResponse.json({ incident })
  } catch (err) {
    console.error('Update incident error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

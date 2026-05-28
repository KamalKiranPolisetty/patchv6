import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Incident from '@/lib/models/Incident'
import { getSession } from '@/lib/session'

function generateIncidentId(): string {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `INC${num}`
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { category = '', subCategory = 'VDI', priority = 5, urgency = 3, impact = 3 } = body

    await connectDB()

    const incidentId = generateIncidentId()
    const incident = await Incident.create({
      incidentId,
      userId: session.userId,
      status: 'Open',
      category,
      subCategory,
      priority,
      urgency,
      impact,
      conversationHistory: [],
      timeline: [{ status: 'Open', timestamp: new Date(), actor: 'System' }],
    })

    return NextResponse.json({ incident })
  } catch (err) {
    console.error('Create incident error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()
    const incidents = await Incident.find({ userId: session.userId }).sort({ createdAt: -1 })
    return NextResponse.json({ incidents })
  } catch (err) {
    console.error('List incidents error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Incident from '@/lib/models/Incident'
import { getSession } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const { rating, comments } = await req.json()
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    await connectDB()
    const incident = await Incident.findOne({ incidentId: id, userId: session.userId })
    if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    incident.feedbackRating = rating
    incident.feedbackComments = comments || ''
    incident.feedbackSubmittedAt = new Date()
    await incident.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Feedback error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

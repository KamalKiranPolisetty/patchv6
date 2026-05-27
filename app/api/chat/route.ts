import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const MODEL = 'gemma4:31b-cloud'

function categoryDetailsFromCategory(category: string | null) {
  const map: Record<string, { subCategory: string; type: string; priority: number; urgency: number; impact: number }> = {
    VDI: { subCategory: 'VDI', type: 'Software', priority: 5, urgency: 3, impact: 3 },
    Printer: { subCategory: 'Printer', type: 'Software', priority: 5, urgency: 3, impact: 3 },
    Scanner: { subCategory: 'Scanner', type: 'Hardware', priority: 5, urgency: 3, impact: 3 },
  }
  return category ? map[category] || map['VDI'] : map['VDI']
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, incidentId, category } = await req.json()

  if (!message) return Response.json({ error: 'Message is required' }, { status: 400 })

  const db = await getDb()

  // Create or retrieve incident
  let currentIncidentId = incidentId
  let incident = null

  if (!currentIncidentId) {
    currentIncidentId = uuidv4()
    const catDetails = categoryDetailsFromCategory(category)
    incident = {
      incidentId: currentIncidentId,
      userId: session.userId,
      status: 'Open',
      category: category || null,
      conversation: [],
      timeline: [{ event: 'Incident created', timestamp: new Date(), by: 'System' }],
      metadata: { ...catDetails },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.collection('PatchTransactions').insertOne(incident)
  } else {
    incident = await db.collection('PatchTransactions').findOne({ incidentId: currentIncidentId })
    if (!incident) return Response.json({ error: 'Incident not found' }, { status: 404 })
    if (incident.status === 'Resolved') {
      return Response.json({ error: 'Incident is resolved' }, { status: 400 })
    }
  }

  // Append user message
  const userMsg = { role: 'user', content: message, timestamp: new Date() }
  await db.collection('PatchTransactions').updateOne(
    { incidentId: currentIncidentId },
    {
      $push: { conversation: userMsg } as never,
      $set: { updatedAt: new Date() },
    }
  )

  // RAG: fetch knowledge base
  const kbQuery = category ? { category } : {}
  const kbDocs = await db.collection('KnowledgeBase').find(kbQuery).toArray()
  const context = kbDocs.length > 0
    ? kbDocs.map((d) => `[${d.category} Documentation]\n${d.content}`).join('\n\n---\n\n')
    : 'No documentation found for this category.'

  // Build conversation history for the LLM
  const history = (incident.conversation || []).map((m: { role: string; content: string }) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }))

  const systemPrompt = `You are Patch, an IT support AI assistant. Use the following documentation to help resolve user issues.

DOCUMENTATION:
${context}

INSTRUCTIONS:
- Provide clear, step-by-step troubleshooting guidance based on the documentation.
- If you resolve the issue, respond with EXACTLY: "Awesome, glad that worked! Is there anything else I can help with?" somewhere in your message and set [RESOLVED] at the end.
- If you cannot resolve the issue after thorough troubleshooting, respond with EXACTLY: "I wasn't able to resolve the issue. I'm escalating this to our Trusted Experts for hands-on support." and set [ESCALATED] at the end.
- Do not escalate prematurely. Try to help first.
- Keep responses concise and professional.`

  // Call Ollama
  let aiResponse = ''
  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!ollamaRes.ok) throw new Error('Ollama error')
    const data = await ollamaRes.json()
    aiResponse = data.message?.content || 'I am having trouble connecting to my brain. Please try again.'
  } catch {
    aiResponse = 'I am having trouble connecting to my brain. Please try again.'
  }

  // Determine status changes
  const isResolved = aiResponse.includes('[RESOLVED]')
  const isEscalated = aiResponse.includes('[ESCALATED]')
  aiResponse = aiResponse.replace(/\[RESOLVED\]/g, '').replace(/\[ESCALATED\]/g, '').trim()

  const aiMsg = { role: 'assistant', content: aiResponse, timestamp: new Date() }

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  const timelineEntry: { event: string; timestamp: Date; by: string } = { event: '', timestamp: new Date(), by: 'Patch' }
  const pushUpdates: Record<string, unknown> = { conversation: aiMsg }

  if (isResolved) {
    updates.status = 'Resolved'
    updates.lastupdatedby = 'Patch'
    timelineEntry.event = 'Issue resolved by Patch'
    pushUpdates['timeline'] = timelineEntry
  } else if (isEscalated) {
    updates.status = 'Escalated'
    updates.lastupdatedby = 'Patch'
    updates.escalationDetails = {
      reason: 'AI unable to resolve issue',
      group: category ? `${category} Support Team` : 'IT Support Team',
      timestamp: new Date(),
    }
    timelineEntry.event = 'Escalated to support team'
    pushUpdates['timeline'] = timelineEntry
  } else {
    timelineEntry.event = 'Response provided'
    pushUpdates['timeline'] = timelineEntry
  }

  await db.collection('PatchTransactions').updateOne(
    { incidentId: currentIncidentId },
    {
      $push: pushUpdates as never,
      $set: updates,
    }
  )

  return Response.json({
    incidentId: currentIncidentId,
    message: aiResponse,
    status: isResolved ? 'Resolved' : isEscalated ? 'Escalated' : incident.status || 'Open',
    isResolved,
    isEscalated,
  })
}

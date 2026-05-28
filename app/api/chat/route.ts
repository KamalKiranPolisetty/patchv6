import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync, readdirSync } from 'fs'
import path from 'path'
import { connectDB } from '@/lib/mongodb'
import Incident from '@/lib/models/Incident'
import { getSession } from '@/lib/session'

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b-cloud'

function loadKBContext(category?: string): { category: string; source: string; content: string } | null {
  const kbRoot = path.join(process.cwd(), 'knowledge_base')

  if (category) {
    const filePath = path.join(kbRoot, category, `${category.toLowerCase()}.txt`)
    if (existsSync(filePath)) {
      return { category, source: `${category.toLowerCase()}.txt`, content: readFileSync(filePath, 'utf-8') }
    }
  }

  // keyword search across all KB files
  try {
    const categories = readdirSync(kbRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)

    for (const cat of categories) {
      const filePath = path.join(kbRoot, cat, `${cat.toLowerCase()}.txt`)
      if (existsSync(filePath)) {
        return { category: cat, source: `${cat.toLowerCase()}.txt`, content: readFileSync(filePath, 'utf-8') }
      }
    }
  } catch {
    // no KB available
  }

  return null
}

async function callOllama(messages: Array<{ role: string; content: string }>): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
    }),
  })

  if (!res.ok) throw new Error(`Ollama returned ${res.status}`)
  const data = await res.json()
  return data.message?.content || ''
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { incidentId, message, category } = await req.json()

    await connectDB()

    const incident = await Incident.findOne({ incidentId, userId: session.userId })
    if (!incident) return NextResponse.json({ error: 'Incident not found' }, { status: 404 })

    const kbContext = loadKBContext(category || incident.category)

    const systemPrompt = kbContext
      ? `You are Patch, a helpful IT support assistant for Discount Tire. You help store associates troubleshoot issues.

KNOWLEDGE BASE (${kbContext.category} - ${kbContext.source}):
${kbContext.content}

INSTRUCTIONS:
- Follow the troubleshooting steps in the knowledge base strictly.
- Ask clarifying questions when needed (e.g., "Are you processing a payment?").
- Keep responses concise and use Markdown formatting (numbered lists, bold for important steps).
- When the issue is resolved, respond with a JSON block at the end: \`\`\`json\n{"action":"resolve"}\n\`\`\`
- When escalation is needed, respond with: \`\`\`json\n{"action":"escalate","reason":"<reason>","assignedGroup":"IT Support Team"}\n\`\`\`
- When asking a Yes/No question about resolution, append: \`\`\`json\n{"uiControl":"decision","question":"Did that resolve your issue?"}\n\`\`\`
- You may append option chips like: \`\`\`json\n{"uiControl":"chips","options":["Yes, it's for me","No, it's for someone else"]}\n\`\`\`
- Stay grounded in the knowledge base. Do not guess.`
      : `You are Patch, a helpful IT support assistant for Discount Tire.
No specific knowledge base is loaded. Ask clarifying questions to determine the issue category before proceeding.
Keep responses concise and use Markdown formatting.`

    const history = incident.conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ]

    let assistantContent: string
    try {
      assistantContent = await callOllama(messages)
    } catch {
      assistantContent = 'Patch is having trouble thinking. Please try again.'
    }

    // update conversation history
    incident.conversationHistory.push({ role: 'user', content: message, timestamp: new Date() })
    incident.conversationHistory.push({ role: 'assistant', content: assistantContent, timestamp: new Date() })

    // detect status changes from response
    const resolveMatch = assistantContent.match(/```json\s*\{[^}]*"action"\s*:\s*"resolve"[^}]*\}\s*```/)
    const escalateMatch = assistantContent.match(/```json\s*(\{[^}]*"action"\s*:\s*"escalate"[^}]*\})\s*```/)

    if (resolveMatch && incident.status === 'Open') {
      incident.status = 'Resolved'
      incident.timeline.push({ status: 'Resolved', timestamp: new Date(), actor: 'Patch' })
    } else if (escalateMatch && incident.status === 'Open') {
      try {
        const parsed = JSON.parse(escalateMatch[1])
        incident.status = 'Escalated'
        incident.escalationReason = parsed.reason || 'Unable to resolve'
        incident.assignedGroup = parsed.assignedGroup || 'IT Support Team'
        incident.timeline.push({ status: 'Escalated', timestamp: new Date(), actor: 'Patch' })
      } catch {
        // ignore parse errors
      }
    }

    await incident.save()

    return NextResponse.json({
      message: assistantContent,
      status: incident.status,
      incidentId: incident.incidentId,
    })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

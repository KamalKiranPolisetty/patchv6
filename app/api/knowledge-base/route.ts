import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const docs = await db.collection('KnowledgeBase').find({}, { projection: { category: 1, filename: 1 } }).toArray()

  const categories = ['VDI', 'Printer', 'Scanner']
  const result = categories.map((cat) => ({
    category: cat,
    hasDoc: docs.some((d) => d.category === cat),
    filename: docs.find((d) => d.category === cat)?.filename || null,
  }))

  return Response.json(result)
}

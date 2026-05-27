import { NextRequest } from 'next/server'
import mammoth from 'mammoth'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const category = formData.get('category') as string | null

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
  if (!category || !['VDI', 'Printer', 'Scanner'].includes(category)) {
    return Response.json({ error: 'Invalid category' }, { status: 400 })
  }
  if (!file.name.endsWith('.docx')) {
    return Response.json({ error: 'Only .docx files are allowed' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await mammoth.extractRawText({ buffer })
  const content = result.value

  const db = await getDb()
  await db.collection('KnowledgeBase').updateOne(
    { category },
    {
      $set: {
        category,
        filename: file.name,
        content,
        uploadedAt: new Date(),
      },
    },
    { upsert: true }
  )

  return Response.json({ success: true })
}

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ user: null })

  const db = await getDb()
  let user = null
  try {
    user = await db.collection('Users').findOne({ _id: new ObjectId(session.userId) }, { projection: { password: 0 } })
  } catch {
    user = null
  }

  return Response.json({ user: user ? { email: user.email, id: session.userId } : null })
}

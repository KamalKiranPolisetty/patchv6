import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/mongodb'
import { setSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const db = await getDb()
  const user = await db.collection('Users').findOne({ email: email.toLowerCase() })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  await setSession({ userId: user._id.toString(), email: user.email })

  return Response.json({ success: true })
}

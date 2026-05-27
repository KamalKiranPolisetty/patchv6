import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/mongodb'
import { generatePassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return Response.json({ error: 'Email is required' }, { status: 400 })
  }

  const db = await getDb()
  const existing = await db.collection('Users').findOne({ email: email.toLowerCase() })

  if (existing) {
    return Response.json({ error: 'User already exists' }, { status: 409 })
  }

  const password = generatePassword()
  const hashed = await bcrypt.hash(password, 12)

  await db.collection('Users').insertOne({
    email: email.toLowerCase(),
    password: hashed,
    createdAt: new Date(),
  })

  return Response.json({ success: true, password })
}

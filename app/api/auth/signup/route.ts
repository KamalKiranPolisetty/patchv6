import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import { createSession, setSessionCookie } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] })
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashed,
      createdAt: new Date(),
    })

    const token = await createSession({
      userId: String(user._id),
      username: user.username,
      email: user.email,
    })
    await setSessionCookie(token)

    return NextResponse.json({ success: true, username: user.username })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

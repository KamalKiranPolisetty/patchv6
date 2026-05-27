import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { signToken, setAuthCookie } from '@/lib/auth';

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    await connectToDatabase();
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    let userId: string;
    let isNewUser = false;
    let generatedPassword: string | undefined;

    if (existingUser) {
      const valid = await bcrypt.compare(password, existingUser.password);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }
      userId = existingUser._id.toString();
    } else {
      generatedPassword = generatePassword();
      const hashed = await bcrypt.hash(generatedPassword, 10);
      const newUser = await User.create({
        email: email.toLowerCase(),
        password: hashed,
        createdAt: new Date(),
      });
      userId = newUser._id.toString();
      isNewUser = true;
    }

    const token = signToken({ userId, email: email.toLowerCase() });
    const payload: Record<string, unknown> = {
      success: true,
      user: { email: email.toLowerCase() },
    };
    if (isNewUser && generatedPassword) {
      payload.isNewUser = true;
      payload.generatedPassword = generatedPassword;
      payload.message =
        'Account created! Please save your generated password — you will need it to log in next time.';
    }

    const res = NextResponse.json(payload, { status: 200 });
    return setAuthCookie(token, res) as NextResponse;
  } catch {
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again later.' },
      { status: 500 }
    );
  }
}

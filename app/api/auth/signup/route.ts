import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { createSession, setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existing) {
      if (existing.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "This username is already taken." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashed,
    });

    const token = await createSession({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    });

    await setSessionCookie(token);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

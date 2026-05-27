import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

declare global {
  var mongoose: { conn: typeof import('mongoose') | null; promise: Promise<typeof import('mongoose')> | null } | undefined;
}

const cached = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

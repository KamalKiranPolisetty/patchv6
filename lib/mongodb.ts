import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

declare global {
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectDB() {
  if (global._mongooseConn) return global._mongooseConn;
  global._mongooseConn = mongoose.connect(MONGODB_URI);
  return global._mongooseConn;
}

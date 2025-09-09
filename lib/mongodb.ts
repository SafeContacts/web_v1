import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set in env');

let clientPromise: Promise<typeof mongoose> | null = null;

export function connect() {
  if (!clientPromise) {
    clientPromise = mongoose.connect(uri!);
  }
  return clientPromise;
}

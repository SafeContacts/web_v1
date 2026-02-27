import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
let clientPromise: Promise<typeof mongoose> | null = null;

export function connect() {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it in Netlify: Site settings → Environment variables.');
  }
  if (!clientPromise) {
    clientPromise = mongoose.connect(uri);
  }
  return clientPromise;
}

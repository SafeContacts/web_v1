import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';

/**
 * GET /api/health
 * Returns env and DB status so you can verify Netlify (or other host) has
 * MONGODB_URI and JWT_SECRET set and that the app can reach MongoDB.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const hasMongo = !!process.env.MONGODB_URI;
  const hasJwt = !!process.env.JWT_SECRET;
  let dbStatus: 'ok' | 'error' | 'skipped' = 'skipped';
  let dbError = '';

  if (hasMongo) {
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI!);
      }
      dbStatus = 'ok';
    } catch (err: any) {
      dbStatus = 'error';
      dbError = err?.message || String(err);
    }
  }

  const status = hasMongo && hasJwt && dbStatus === 'ok' ? 200 : 503;
  res.status(status).json({
    ok: status === 200,
    env: {
      MONGODB_URI: hasMongo ? 'set' : 'missing',
      JWT_SECRET: hasJwt ? 'set' : 'missing',
    },
    db: dbStatus === 'skipped' ? 'not_checked' : dbStatus,
    ...(dbError ? { dbError } : {}),
  });
}

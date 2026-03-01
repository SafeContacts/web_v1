import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import User   from '../../../models/User';
import { connect } from '../../../lib/mongodb';
import { signToken } from '../../../src/lib/jwt';
import { setRefreshToken } from '../../../src/lib/cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'phone and password required' });
  }

  try {
    await connect();
  } catch (err: unknown) {
    console.error('[login] DB connect failed:', err);
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'Could not connect to database.',
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({
      error: 'Server misconfiguration',
      message: 'JWT_SECRET is not set.',
    });
  }

  try {
    const user = await User.findOne({ phone }).lean();
    const passwordHash = user && (user as { passwordHash?: string }).passwordHash;
    if (!user || !passwordHash || !(await bcrypt.compare(password, passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const accessToken  = signToken({ sub: (user as { _id: unknown })._id, role: (user as { role?: string }).role ?? 'user' }, '2d');
    const refreshToken = signToken({ sub: (user as { _id: unknown })._id }, '7d');
    setRefreshToken(res, refreshToken);
    return res.status(200).json({ accessToken });
  } catch (err: unknown) {
    console.error('[login] Error:', err);
    return res.status(500).json({
      error: 'Login failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}


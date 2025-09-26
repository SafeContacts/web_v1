import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, signToken } from '../../../src/lib/jwt';
import { getRefreshToken, setRefreshToken, clearRefreshToken } from '../../../src/lib/cookies';
import User from '../../../models/User';
import { connect } from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  if (req.method !== 'POST') return res.status(405).end();
  const token = getRefreshToken(req);
  if (!token) return res.status(401).json({ error: 'Missing refresh token' });
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) throw new Error();
    const accessToken  = signToken({ sub: user._id, role: user.role }, '2d');
    const refreshToken = signToken({ sub: user._id }, '7d');
    setRefreshToken(res, refreshToken);
    res.status(200).json({ accessToken });
  } catch {
    clearRefreshToken(res);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}


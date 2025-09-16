import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import User   from '../../../models/User';
import { connect } from '../../../lib/mongodb';
import { signToken } from '../../../src/lib/jwt';
import { setRefreshToken } from '../../../src/lib/cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  if (req.method !== 'POST') return res.status(405).end();
  const { phone, password } = req.body;
  const user = await User.findOne({ phone });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const accessToken  = signToken({ sub: user._id, role: user.role }, '4h');
  const refreshToken = signToken({ sub: user._id }, '7d');
  setRefreshToken(res, refreshToken);
  res.status(200).json({ accessToken });
}


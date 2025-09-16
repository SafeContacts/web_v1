import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import User   from '../../../models/User';
import { connect } from '../../../lib/mongodb';
import { signToken } from '../../../src/lib/jwt';
import { setRefreshToken } from '../../../src/lib/cookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  if (req.method !== 'POST') return res.status(405).end();
  const { phone, password, name } = req.body;
  if (!phone || !password || !name) {
    return res.status(400).json({ error: 'phone, password & name required' });
  }
  if (await User.findOne({ phone })) {
    return res.status(409).json({ error: 'User exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ phone, name, passwordHash });
  // Ensure a Contact exists for this phone, mark it “alive”
  await Contact.findOneAndUpdate(
   { phone },
     {
	phone,
	name,
	email: phone + '@hidden.local', // placeholder until user provides
	isRegistered: true,
	userRef: user._id
     },
     { upsert: true, setDefaultsOnInsert: true }
  );
  const accessToken  = signToken({ sub: user._id, role: user.role }, '4h');
  const refreshToken = signToken({ sub: user._id }, '7d');
  setRefreshToken(res, refreshToken);
  res.status(201).json({ accessToken });
}


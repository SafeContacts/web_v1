import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { phone, otp } = req.body;
  const token = jwt.sign({ phone }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.status(200).json({ accessToken: token });
}

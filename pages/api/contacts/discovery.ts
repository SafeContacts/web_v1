import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../lib/mongodb';
import User from '../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { query } = req.query;
  const users = await User.find({
    publicProfile: true,
    $or: [
      { phone: { $regex: query, $options: 'i' } },
      { name:  { $regex: query, $options: 'i' } }
    ]
  }).limit(20);
  res.status(200).json(users);
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }             from '../../../lib/mongodb';
import User                     from '../../../models/User';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  await connect();
  const users = await User.find().lean();
  res.status(200).json(users);
}

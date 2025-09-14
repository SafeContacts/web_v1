// pages/api/business/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import Business from '../../../models/Business';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { search } = req.query;
  const list = await Business.find({ name: { $regex: search as string, $options: 'i' } }).limit(20);
  res.status(200).json(list);
}


import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }             from '../../../lib/mongodb';
import TrustEdge               from '../../../models/TrustEdge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  if (req.method !== 'POST') {
    res.setHeader('Allow',['POST']);
    return res.status(405).end();
  }
  const { fromUser, toUser } = req.body;
  if (!fromUser || !toUser) {
    return res.status(400).json({ error: 'fromUser and toUser required' });
  }
  const edge = await TrustEdge.create({ fromUser, toUser, confirmed: false });
  res.status(201).json(edge);
}


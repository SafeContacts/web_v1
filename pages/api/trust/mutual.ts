import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }             from '../../../lib/mongodb';
import TrustEdge               from '../../../models/TrustEdge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { userA, userB } = req.query as { userA: string, userB: string };
  if (!userA || !userB) return res.status(400).json({ error: 'userA & userB required' });

  // count both directions confirmed
  const count = await TrustEdge.countDocuments({
    confirmed: true,
    $or: [
      { fromUser: userA, toUser: userB },
      { fromUser: userB, toUser: userA }
    ]
  });
  res.status(200).json({ mutualCount: count });
}


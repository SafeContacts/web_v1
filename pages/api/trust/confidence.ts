import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }             from '../../../lib/mongodb';
import TrustEdge               from '../../../models/TrustEdge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { userId } = req.query as { userId: string };
  if (!userId) return res.status(400).json({ error: 'userId required' });

  // For MVP: score = min(mutuals * 20, 100)
  const mutuals = await TrustEdge.countDocuments({
    confirmed: true,
    $or: [
      { fromUser: userId },
      { toUser: userId }
    ]
  });
  const score = Math.min(mutuals * 20, 100);
  res.status(200).json({ confidenceScore: score });
}


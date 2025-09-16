import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../src/middleware/requireAuth';
import { connect } from '../../../lib/mongodb';
import SyncDelta    from '../../../models/SyncDelta';

export default requireAuth(async function handler(req:NextApiRequest,res:NextApiResponse) {
  await connect();
  if (req.method !== 'POST') return res.status(405).end();
  const userId = (req as any).user.sub;
  const { deltaIds }: { deltaIds: string[] } = req.body;
  if (!Array.isArray(deltaIds)) {
    return res.status(400).json({ error: 'deltaIds array required' });
  }
  await SyncDelta.updateMany(
    { userId, _id: { $in: deltaIds } },
    { $set: { resolved:true } }
  );
  res.status(200).json({ updatedCount: deltaIds.length });
});


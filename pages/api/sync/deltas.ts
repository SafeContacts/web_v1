import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../src/middleware/requireAuth';
import { connect } from '../../../lib/mongodb';
import SyncDelta from '../../../models/SyncDelta';

export default requireAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const userId = (req as any).user.sub;
  const pending = await SyncDelta.find({ userId, resolved:false }).lean();
  res.status(200).json(pending);
});


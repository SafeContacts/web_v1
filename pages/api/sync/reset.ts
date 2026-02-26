// pages/api/sync/reset.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth }  from '../../../src/middleware/requireAuth';
import { connect }      from '../../../lib/mongodb';
import SyncSnapshot from '../../../models/SyncSnapshot';
import SyncDelta        from '../../../models/SyncDelta';

export default requireAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  await connect();
  const userId = (req as any).user.sub;
  await SyncSnapshot.deleteOne({ userId });
  await SyncDelta.deleteMany({ userId });
  res.status(200).json({ message: 'Sync state reset' });
});


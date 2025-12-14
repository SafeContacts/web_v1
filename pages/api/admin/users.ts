import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import { withAuth } from '../../../lib/auth';
import User from '../../../models/User';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  
  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
  }

  // Verify admin role
  const userDoc = await User.findById(user.sub).lean();
  if (!userDoc || userDoc.role !== 'admin') {
    return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'Admin access required' });
  }

  const users = await User.find().lean();
  res.status(200).json(users);
}

export default withAuth(handler);

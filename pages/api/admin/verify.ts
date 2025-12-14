// pages/api/admin/verify.ts
// Verify that the authenticated user is an admin
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { withAuth } from '../../../lib/auth';
import User from '../../../models/User';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
  }

  try {
    const userDoc = await User.findById(user.sub).lean();
    if (!userDoc) {
      return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'User not found' });
    }

    if (userDoc.role !== 'admin') {
      return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'Admin access required' });
    }

    return res.status(200).json({ ok: true, role: userDoc.role });
  } catch (err: any) {
    console.error('Admin verify error:', err);
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to verify admin status' });
  }
}

export default withAuth(handler);


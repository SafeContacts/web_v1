// pages/api/contacts/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth }      from '../../../src/middleware/requireAuth';
import { connect }          from '../../../lib/mongodb';
import SyncSnapshot         from '../../../models/SyncSnapshot';
import Contact              from '../../../models/Contact';

export default requireAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { sub: userId, role } = (req as any).user;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  if (role === 'admin') {
    // Admin sees all registered/global contacts
    const all = await Contact.find().lean();
    return res.status(200).json(all);
  }

  // Regular user: get their snapshot
  const snap = await SyncSnapshot.findOne({ userId }).lean();
  if (!snap) {
    return res.status(200).json([]); // no imports yet
  }

  // Return the raw contact entries they imported
  return res.status(200).json(snap.contacts);
});


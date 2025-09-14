// pages/api/calls/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import CallLog     from '../../../models/CallLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();

  if (req.method === 'POST') {
    const { contactId, phone, outgoing } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'phone is required' });
      return;
    }
    const log = await CallLog.create({ contactId, phone, outgoing });
    res.status(201).json(log);
    return;
  }

  if (req.method === 'GET') {
    // Optionally filter by contactId: ?contactId=...
    const filter: any = {};
    if (req.query.contactId) filter.contactId = req.query.contactId;
    const logs = await CallLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.status(200).json(logs);
    return;
  }

  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}


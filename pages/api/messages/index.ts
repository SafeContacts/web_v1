// pages/api/messages/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }                        from '../../../lib/mongodb';
import MessageLog                          from '../../../models/MessageLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();

  if (req.method === 'POST') {
    const { contactId, phone, outgoing, message } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'phone is required' });
      return;
    }
    const log = await MessageLog.create({ contactId, phone, outgoing, message });
    res.status(201).json(log);
    return;
  }

  if (req.method === 'GET') {
    const filter: any = {};
    if (req.query.contactId) filter.contactId = req.query.contactId;
    const logs = await MessageLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.status(200).json(logs);
    return;
  }

  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}


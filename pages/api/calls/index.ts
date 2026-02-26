// pages/api/calls/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { connect } from '../../../lib/mongodb';
import CallLog from '../../../models/CallLog';
import Contact from '../../../models/Contact';
import { computeConfidenceScore } from '../../../lib/confidenceScore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();

  if (req.method === 'POST') {
    const { contactId, phone, outgoing } = req.body as { contactId?: string; phone?: string; outgoing?: boolean };
    if (!phone) {
      res.status(400).json({ error: 'phone is required' });
      return;
    }
    const userId = (req as any).user?.sub ?? '';
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    // Legacy endpoint: prefer POST /api/calls/calllog for full logging with person resolution
    const placeholderId = new mongoose.Types.ObjectId();
    const log = await CallLog.create({
      userId,
      fromPersonId: placeholderId,
      toPersonId: placeholderId,
      type: 'call',
      duration: 0,
      timestamp: new Date(),
    });
    if (contactId) {
      try {
        const newScore = await computeConfidenceScore(contactId, userId);
        await Contact.findByIdAndUpdate(contactId, { trustScore: newScore });
      } catch (err) {
        console.error('Failed to update trust score after call log', err);
      }
    }
    return res.status(201).json(log);
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


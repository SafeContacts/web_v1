import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import { CallLog } from '../../../models/CallLog';
import { Contact } from '../../../models/Contact';
// Import the advanced confidence score calculator to incorporate additional signals.
import { computeAdvancedConfidenceScore } from '../../../lib/confidenceScore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { method } = req;
  switch (method) {
    case 'GET': {
      const { userId, limit = '50' } = req.query;
      if (!userId || Array.isArray(userId)) {
        return res.status(400).json({ error: 'userId is required', req: req.query });
      }
      const logs = await CallLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string, 10) || 50)
        .lean();
      return res.status(200).json(logs);
    }
    case 'POST': {
      const { userId, contactId, phoneNumber, type, duration } = req.body;
      if (!userId || !phoneNumber || !type) {
        return res.status(400).json({ error: 'userId, phoneNumber and type are required' });
      }
      // Normalize duration: ensure it's a positive number; default to 0 if missing or invalid.
      const callDuration = typeof duration === 'number' && duration > 0 ? duration : 0;
      const log = await CallLog.create({ userId, contactId, phoneNumber, type, duration: callDuration, timestamp: new Date() });
      // Recompute the trust score for the contact if a contactId is provided.
      // The trust score is stored on the contact document for quick access.
      if (contactId) {
        try {
          const newScore = await computeAdvancedConfidenceScore(contactId as string, userId);
          await Contact.findByIdAndUpdate(contactId, { trustScore: newScore });
        } catch (err) {
          console.error('Failed to update trust score after call log', err);
        }
      }
      return res.status(201).json(log);
    }
    default:
      return res.setHeader('Allow', ['GET', 'POST']).status(405).end(`Method ${method} Not Allowed`);
  }
}

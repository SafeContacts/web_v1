import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
// Use named imports because the Mongoose models are exported as named constants.
import { CallLog } from '../../../models/CallLog';
import { Contact } from '../../../models/Contact';
// Import the advanced confidence score calculator to incorporate additional signals.
import { computeAdvancedConfidenceScore } from '../../../lib/confidenceScore';
import { requireAuth } from '../../../src/middleware/requireAuth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { method } = req;
  switch (method) {
    case 'GET': {
      const { limit = '50' } = req.query;
      // Allow explicit userId query (for admin) but fallback to authenticated user
      const queryUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const authUserId = (req as any).user?.sub;
      const userId = queryUserId || authUserId;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const logs = await CallLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string, 10) || 50)
        .lean();
      return res.status(200).json(logs);
    }
    case 'POST': {
      const { contactId, phoneNumber, type, duration } = req.body;
      const userId = (req as any).user?.sub;
      if (!userId || !phoneNumber || !type) {
        return res.status(400).json({ error: 'phoneNumber and type are required' });
      }
      const callDuration = typeof duration === 'number' && duration > 0 ? duration : 0;
      const log = await CallLog.create({
        userId,
        contactId,
        phoneNumber,
        type,
        duration: callDuration,
        timestamp: new Date(),
      });
      // Recompute the trust score for the contact if a contactId is provided.
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
      return res
        .setHeader('Allow', ['GET', 'POST'])
        .status(405)
        .end(`Method ${method} Not Allowed`);
  }
}

export default requireAuth(handler, ['user', 'admin']);

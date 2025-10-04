/*** Add File: pages/api/messages/index.ts
   API route for logging SMS messages. POST requests log an outgoing SMS and
   optionally associate it with a contact. GET requests return recent SMS
   logs for the authenticated user. Messages are stored in the CallLog
   collection with type 'sms' for simplicity.
***/

import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
// Use named imports because the Mongoose models are exported as named constants.
import { CallLog } from '../../../models/CallLog';
import { Contact } from '../../../models/Contact';
import { requireAuth } from '../../../src/middleware/requireAuth';
import { computeAdvancedConfidenceScore } from '../../../lib/confidenceScore';

//export default requireAuth(async function handler(
async function handler( req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { method } = req;
  switch (method) {
    case 'GET': {
      const { limit = '50' } = req.query;
      const queryUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const authUserId = (req as any).user?.sub;
      const userId = queryUserId || authUserId;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const logs = await CallLog.find({ userId, type: 'sms' })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string, 10) || 50)
        .lean();
      return res.status(200).json(logs);
    }
    case 'POST': {
      const { contactId, phoneNumber, message } = req.body;
      const userId = (req as any).user?.sub;
      if (!userId || !phoneNumber) {
        return res.status(400).json({ error: 'phoneNumber is required' });
      }
      const log = await CallLog.create({
        userId,
        contactId,
        phoneNumber,
        type: 'sms',
        duration: 0,
        timestamp: new Date(),
      });
      // Optionally update trust score based on SMS interaction
      if (contactId) {
        try {
          const newScore = await computeAdvancedConfidenceScore(contactId as string, userId);
          await Contact.findByIdAndUpdate(contactId, { trustScore: newScore });
        } catch (err) {
          console.error('Failed to update trust score after SMS log', err);
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
//}, ['user', 'admin']);
}

export default requireAuth(handler, ['user', 'admin']);

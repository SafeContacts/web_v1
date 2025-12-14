/*** Add File: pages/api/messages/index.ts
   API route for logging SMS messages. POST requests log an outgoing SMS and
   optionally associate it with a contact. GET requests return recent SMS
   logs for the authenticated user. Messages are stored in the CallLog
   collection with type 'sms' for simplicity.
***/

import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { connect } from '../../../lib/mongodb';
import CallLog from '../../../models/CallLog';
import Contact from '../../../models/Contact';
import { withAuth } from '../../../lib/auth';
import { computeAdvancedConfidenceScore } from '../../../lib/confidenceScore';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const user: any = (req as any).user;

  // Require authentication
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
  }

  // Ensure database connection
  if (mongoose.connection.readyState === 0) {
    await connect();
  }
  switch (method) {
    case 'GET': {
      try {
        const { limit = '50' } = req.query;
        const userId = user.sub;
        const logs = await CallLog.find({ userId, type: 'sms' })
          .sort({ timestamp: -1 })
          .limit(parseInt(limit as string, 10) || 50)
          .lean();
        return res.status(200).json(logs);
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch message logs' });
      }
    }
    case 'POST': {
      try {
        const { contactId, phoneNumber, message } = req.body;
        const userId = user.sub;
        if (!phoneNumber) {
          return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'phoneNumber is required' });
        }
        const log = await CallLog.create({
          userId,
          contactId,
          phoneNumber,
          type: 'sms',
          duration: 0,
          timestamp: new Date(),
        });
        // Update trust score based on SMS interaction
        // Note: This uses Person-based trust scoring if toPersonId is available
        // For now, we'll update Contact trust score
        if (contactId) {
          try {
            const newScore = await computeAdvancedConfidenceScore(contactId as string, userId);
            await Contact.findByIdAndUpdate(contactId, { trustScore: newScore });
          } catch (err) {
            console.error('Failed to update trust score after SMS log', err);
          }
        }
        return res.status(201).json({
          _id: log._id.toString(),
          type: log.type,
          timestamp: log.timestamp,
          phoneNumber: log.phoneNumber,
        });
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to create message log' });
      }
    }
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default withAuth(handler);

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
import ContactAlias from '../../../models/ContactAlias';
import ContactEdge from '../../../models/ContactEdge';
import Person from '../../../models/Person';
import User from '../../../models/User';
import { withAuth } from '../../../lib/auth';

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
          .populate('toPersonId', 'phones emails')
          .populate('fromPersonId', 'phones emails')
          .lean();
        
        // Enrich with alias names
        const enrichedLogs = await Promise.all(
          logs.map(async (log: any) => {
            const toPersonId = log.toPersonId?._id || log.toPersonId;
            const alias = await ContactAlias.findOne({
              userId: user.sub,
              personId: toPersonId,
            }).lean();
            
            return {
              ...log,
              toPerson: log.toPersonId
                ? {
                    id: toPersonId.toString(),
                    name: alias?.alias || log.toPersonId.emails?.[0]?.value || log.toPersonId.phones?.[0]?.value || 'Unknown',
                    phones: log.toPersonId.phones || [],
                    emails: log.toPersonId.emails || [],
                  }
                : null,
            };
          })
        );
        
        return res.status(200).json(enrichedLogs);
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch message logs' });
      }
    }
    case 'POST': {
      try {
        const { toAliasId, toPersonId, phoneNumber } = req.body;
        const userId = user.sub;
        
        // Determine the target person
        let targetPersonId: any;
        let aliasDoc: any = null;
        
        if (toAliasId) {
          aliasDoc = await ContactAlias.findById(toAliasId);
          if (!aliasDoc) {
            return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Alias not found' });
          }
          targetPersonId = aliasDoc.personId;
        } else if (toPersonId) {
          const person = await Person.findById(toPersonId);
          if (!person) {
            return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Person not found' });
          }
          targetPersonId = toPersonId;
        } else if (phoneNumber) {
          // Find person by phone number
          const person = await Person.findOne({
            $or: [
              { 'phones.value': phoneNumber },
              { 'phones.e164': phoneNumber },
            ],
          }).lean();
          if (!person) {
            return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Person not found for phone number' });
          }
          targetPersonId = person._id;
        } else {
          return res.status(400).json({
            ok: false,
            code: 'VALIDATION_ERROR',
            message: 'toAliasId, toPersonId, or phoneNumber is required',
          });
        }
        
        // Find caller's personId
        const caller = await User.findById(user.sub);
        if (!caller || !caller.personId) {
          return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Person not found for user' });
        }
        const fromPersonId = caller.personId;
        const now = new Date();
        
        // Create message log entry
        const log = await CallLog.create({
          userId: user.sub,
          fromPersonId,
          toPersonId: targetPersonId,
          type: 'sms',
          duration: 0,
          timestamp: now,
        });
        
        // Update alias's lastContactedAt for the caller if exists
        if (!aliasDoc) {
          aliasDoc = await ContactAlias.findOne({ userId: user.sub, personId: targetPersonId });
        }
        if (aliasDoc) {
          aliasDoc.lastContactedAt = now;
          await aliasDoc.save();
        }
        
        // Update contact edge weight and lastContactedAt
        let edge = await ContactEdge.findOne({ fromPersonId, toPersonId: targetPersonId });
        if (edge) {
          edge.weight += 1;
          edge.lastContactedAt = now;
          await edge.save();
        } else {
          await ContactEdge.create({ fromPersonId, toPersonId: targetPersonId, weight: 1, lastContactedAt: now });
        }
        
        // Update trust score based on interactions
        try {
          const { calculateTrustScoreFromInteractions } = await import('../../../lib/trustScore');
          const trustScore = await calculateTrustScoreFromInteractions(fromPersonId, targetPersonId, user.sub);
          // Update Person's trust score
          await Person.findByIdAndUpdate(targetPersonId, { $set: { trustScore: trustScore } }, { upsert: false });
        } catch (err) {
          console.error('Failed to update trust score', err);
        }
        
        return res.status(201).json({
          _id: log._id.toString(),
          type: log.type,
          timestamp: log.timestamp,
          toPersonId: targetPersonId.toString(),
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

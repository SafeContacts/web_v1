
*** Add File: pages/api/calllog/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../../lib/auth";
import mongoose from "mongoose";

import CallLog from "../../../models/CallLog";
import ContactAlias from "../../../models/ContactAlias";
import ContactEdge from "../../../models/ContactEdge";
import Person from "../../../models/Person";
import User from "../../../models/User";

/**
 * Call and SMS logging API.  Records an interaction between the
 * authenticated user and another person.  This endpoint accepts a
 * `toAliasId` (preferred) or `toPersonId`, along with a `type` ("call"
 * or "sms") and an optional `duration` in seconds.  A new CallLog
 * document is created, the caller's ContactAlias (if present) is
 * updated with the latest contact timestamp, and the corresponding
 * ContactEdge weight is incremented.  Only POST is supported.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: "UNAUTHORIZED" });
  }
  // Ensure database connection
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  switch (method) {
    case "GET": {
      try {
        const { limit = '50' } = req.query;
        const userId = user.sub;
        const logs = await CallLog.find({ userId, type: 'call' })
          .sort({ timestamp: -1 })
          .limit(parseInt(limit as string, 10) || 50)
          .populate('toPersonId', 'phones emails')
          .lean();
        return res.status(200).json(logs);
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ ok: false, code: "INTERNAL_ERROR", message: "Failed to fetch call logs" });
      }
    }
    case "POST": {
      try {
    const { toAliasId, toPersonId, type, duration } = req.body || {};
    if (!type || !["call", "sms"].includes(type)) {
      return res.status(400).json({ ok: false, code: "VALIDATION_ERROR", message: "Invalid or missing type" });
    }
    // Determine the target person
    let targetPersonId: any;
    let aliasDoc: any = null;
    if (toAliasId) {
      aliasDoc = await ContactAlias.findById(toAliasId);
      if (!aliasDoc) {
        return res.status(404).json({ ok: false, code: "NOT_FOUND", message: "Alias not found" });
      }
      targetPersonId = aliasDoc.personId;
    } else if (toPersonId) {
      const person = await Person.findById(toPersonId);
      if (!person) {
        return res.status(404).json({ ok: false, code: "NOT_FOUND", message: "Person not found" });
      }
      targetPersonId = toPersonId;
    } else {
      return res.status(400).json({ ok: false, code: "VALIDATION_ERROR", message: "toAliasId or toPersonId is required" });
    }
    // Find caller's personId
    const caller = await User.findById(user.sub);
    if (!caller || !caller.personId) {
      return res.status(404).json({ ok: false, code: "NOT_FOUND", message: "Person not found for user" });
    }
    const fromPersonId = caller.personId;
    const now = new Date();
    // Create call log entry
    const log = await CallLog.create({
      userId: user.sub,
      fromPersonId,
      toPersonId: targetPersonId,
      type,
      duration: type === "call" ? Number(duration) || 0 : 0,
      timestamp: now,
    });
    // Update alias's lastContactedAt for the caller if exists
    if (!aliasDoc) {
      // Attempt to find alias for this user and person
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
      const { calculateTrustScoreFromInteractions } = await import("../../../lib/trustScore");
      const trustScore = await calculateTrustScoreFromInteractions(
        fromPersonId,
        targetPersonId,
        user.sub
      );
      // Update Person's trust score
      await Person.findByIdAndUpdate(targetPersonId, {
        $set: { trustScore: trustScore },
      }, { upsert: false });
    } catch (err) {
      console.error('Failed to update trust score', err);
    }
        return res.status(201).json({
          _id: log._id.toString(),
          type: log.type,
          duration: log.duration,
          timestamp: log.timestamp,
          toPersonId: targetPersonId.toString(),
        });
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ ok: false, code: "INTERNAL_ERROR", message: "Failed to create call log" });
      }
    }
    default: {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }
  }
}

export default withAuth(handler);

/*****************************************************************************************************************

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
*****************************************************************************************************************/

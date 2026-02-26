// pages/api/call/make.ts
// API to make a call (inbuilt calling functionality)
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { withAuth } from '../../../lib/auth';
import User from '../../../models/User';
import Person from '../../../models/Person';
import CallLog from '../../../models/CallLog';
import ContactEdge from '../../../models/ContactEdge';
import ContactAlias from '../../../models/ContactAlias';
import Permission from '../../../models/Permission';
import { calculateTrustScoreFromInteractions } from '../../../lib/trustScore';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
  }

  try {
    // Check permissions
    const permission = await Permission.findOne({ userId: user.sub }).lean() as { permissions?: { makeCalls?: boolean } } | null | undefined;
    if (!permission?.permissions?.makeCalls) {
      return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'Calling permission not granted' });
    }

    const { toPersonId, toAliasId, duration } = req.body;
    
    if (!toPersonId && !toAliasId) {
      return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'toPersonId or toAliasId is required' });
    }

    // Get caller's personId
    const caller = await User.findById(user.sub).lean() as { personId?: unknown } | null | undefined;
    if (!caller || !caller.personId) {
      return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Person not found for user' });
    }
    const fromPersonId = caller.personId;

    // Get target person
    let targetPersonId: any;
    if (toAliasId) {
      const alias = await ContactAlias.findById(toAliasId).lean() as { personId?: unknown } | null | undefined;
      if (!alias) {
        return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Alias not found' });
      }
      targetPersonId = alias.personId;
    } else {
      targetPersonId = toPersonId;
    }

    const now = new Date();
    const callDuration = duration || Math.floor(Math.random() * 300) + 30; // Default 30-330 seconds

    // Create call log
    const callLog = await CallLog.create({
      userId: user.sub,
      fromPersonId,
      toPersonId: targetPersonId,
      type: 'call',
      duration: callDuration,
      timestamp: now,
    });

    // Update ContactEdge
    await ContactEdge.findOneAndUpdate(
      { fromPersonId, toPersonId: targetPersonId },
      { $inc: { weight: 1 }, lastContactedAt: now },
      { upsert: true, new: true }
    );

    // Update ContactAlias lastContactedAt
    await ContactAlias.findOneAndUpdate(
      { userId: user.sub, personId: targetPersonId },
      { lastContactedAt: now },
      { upsert: false }
    );

    // Update trust score
    try {
      const fromId = fromPersonId instanceof mongoose.Types.ObjectId ? fromPersonId : new mongoose.Types.ObjectId(String(fromPersonId));
      const toId = targetPersonId instanceof mongoose.Types.ObjectId ? targetPersonId : new mongoose.Types.ObjectId(String(targetPersonId));
      const trustScore = await calculateTrustScoreFromInteractions(fromId, toId, user.sub);
      await Person.findByIdAndUpdate(targetPersonId, { $set: { trustScore } }, { upsert: false });
    } catch (err) {
      console.error('Failed to update trust score:', err);
    }

    // In a real app, you would integrate with a calling service (Twilio, etc.)
    // For now, we just log the call
    
    return res.status(200).json({
      ok: true,
      message: 'Call initiated',
      callLog: {
        id: callLog._id.toString(),
        duration: callDuration,
        timestamp: now,
      },
      // In production, return actual call connection details
      callSid: `mock-call-${Date.now()}`, // Mock call SID
    });
  } catch (err: any) {
    console.error('Make call error:', err);
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to make call' });
  }
}

export default withAuth(handler);


// pages/api/message/send.ts
// API to send a message (inbuilt messaging functionality)
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
    const permission = await Permission.findOne({ userId: user.sub }).lean() as { permissions?: { sendMessages?: boolean } } | null | undefined;
    if (!permission?.permissions?.sendMessages) {
      return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'Messaging permission not granted' });
    }

    const { toPersonId, toAliasId, message } = req.body;
    
    if (!toPersonId && !toAliasId) {
      return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'toPersonId or toAliasId is required' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'Message is required' });
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

    // Create message log
    const messageLog = await CallLog.create({
      userId: user.sub,
      fromPersonId,
      toPersonId: targetPersonId,
      type: 'sms',
      duration: 0,
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

    // In a real app, you would integrate with SMS service (Twilio, etc.)
    // For now, we just log the message
    
    return res.status(200).json({
      ok: true,
      message: 'Message sent',
      messageLog: {
        id: messageLog._id.toString(),
        timestamp: now,
      },
      // In production, return actual message SID
      messageSid: `mock-msg-${Date.now()}`, // Mock message SID
    });
  } catch (err: any) {
    console.error('Send message error:', err);
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to send message' });
  }
}

export default withAuth(handler);


// pages/api/sync/network-updates.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth }      from '../../../src/middleware/requireAuth';
import { connect }          from '../../../lib/mongodb';
import SyncSnapshot         from '../../../models/SyncSnapshot';
import UpdateEvent          from '../../../models/UpdateEvent';
import TrustEdge            from '../../../models/TrustEdge';
import UserActivity         from '../../../models/UserActivity';
import { Server as IOServer } from 'socket.io';

export default requireAuth(async (req, res) => {
  await connect();
  const userId = (req as any).user.sub;
  const snap   = await SyncSnapshot.findOne({ userId }).lean();
  if (!snap) return res.json([]);

  // Map phone→contactId
  const phones = snap.contacts.map(c => c.phone);
  const events = await UpdateEvent.find({ stealth:false, phone:{ $in: phones } })
    .sort({ createdAt:-1 }).lean();

  // Group by (phone, field)
  const groups: Record<string, any[]> = {};
  for (const e of events) {
    const key = `${e.phone}_${e.field}`;
    (groups[key] ||= []).push(e);
  }

  // Compute simple trust for each suggestion: number of confirmed mutual between user and suggester
  const result = await Promise.all(Object.values(groups).map(async arr => {
    const contactPhone = arr[0].phone;
    const field        = arr[0].field;
    const suggestions = await Promise.all(arr.map(async e => {
      const mutuals = await TrustEdge.countDocuments({
        confirmed: true,
        $or:[
          { fromUser: userId,   toUser: e.userId },
          { fromUser: e.userId, toUser: userId }
        ]
      });
      return {
        eventId:  e._id,
        newValue: e.newValue,
        ts:       e.createdAt,
        source:   e.userId,
        trust:    mutuals
      };
    }));
    return { phone:contactPhone, field, suggestions };
  }));
 
  // after applying the network update
//  const io = (res.socket.server as any).io as IOServer;
 // io.to(userId).emit('network:update', { userId, field, newValue });
  res.json(result);
});


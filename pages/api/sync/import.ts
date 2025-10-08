import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../src/middleware/requireAuth';
import { connect } from '../../../lib/mongodb';
import { SyncSnapshot } from '../../../models/SyncSnapshot';
import SyncDelta    from '../../../models/SyncDelta';
import UserActivity from '../../../models/UserActivity';
import { Server as IOServer } from 'socket.io';


export default requireAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  if (req.method !== 'POST') return res.status(405).end();

  const userId = (req as any).user.sub;
  const newList: { phone:string; name:string; email?:string; company?:string }[] = req.body.contacts;
  if (!Array.isArray(newList)) return res.status(400).json({ error: 'contacts array required', newList: req.body.contacts });

  // Load prior snapshot
  let snap = await SyncSnapshot.findOne({ userId }).lean();
  const oldList = snap?.contacts || [];

  // Compute deltas
  const deltas: any[] = [];
  const oldMap = new Map(oldList.map(c => [c.phone, c]));

  // 1) new or updated
  for (const c of newList) {
    const prev = oldMap.get(c.phone);
    if (!prev) {
      deltas.push({ phone: c.phone, field:'record', oldValue:'', newValue:JSON.stringify(c), type:'new' });

    } else {
      for (const f of ['name','email','company'] as const) {
        if ((c[f]||'') !== (prev[f]||'')) {
          deltas.push({ phone: c.phone, field:f, oldValue:prev[f]||'', newValue:c[f]||'', type:'update' });
        }
      }
    }
  }

  // 2) deletions
  const newMap = new Map(newList.map(c => [c.phone, c]));
  for (const c of oldList) {
    if (!newMap.has(c.phone)) {
      deltas.push({ phone: c.phone, field:'record', oldValue:JSON.stringify(c), newValue:'', type:'delete' });

    }
  }

  // Persist snapshot & deltas
  await SyncSnapshot.findOneAndUpdate(
    { userId },
    { $set: { contacts: newList, updatedAt: new Date() } },
    { upsert: true }
  );
  // clear old unresolved
  await SyncDelta.updateMany({ userId, resolved:false }, { resolved:true });
  // insert new
  if (deltas.length) {
    await SyncDelta.insertMany(deltas.map(d => ({ ...d, userId })));
  }
  await UserActivity.create({ userId, type:'import' }); // or 'import', 'apply_network'

  // emit to this user that new deltas arrived
  const io = (res.socket.server as any).io as IOServer;
  io.to(userId).emit('sync:import', deltas);

  return res.status(200).json(deltas);
});


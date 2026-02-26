// pages/api/updates/network.ts
// Network updates API - shows updates from 1st level connections only
// Respects stealth mode - users in stealth mode don't send updates
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { withAuth } from '../../../lib/auth';
import Person from '../../../models/Person';
import ContactEdge from '../../../models/ContactEdge';
import ContactAlias from '../../../models/ContactAlias';
import UpdateEvent from '../../../models/UpdateEvent';
import User from '../../../models/User';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  // Ensure database connection
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
  }

  try {
    // Get caller's personId
    const caller = await User.findById(user.sub).lean() as { personId?: unknown } | null | undefined;
    if (!caller || !caller.personId) {
      return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Person not found for user' });
    }
    const callerPersonId = caller.personId;

    // Get 1st level connections (direct contacts)
    const firstLevelEdges = await ContactEdge.find({ fromPersonId: callerPersonId }).lean();
    const firstLevelPersonIds = firstLevelEdges.map((e) => e.toPersonId.toString());

    if (firstLevelPersonIds.length === 0) {
      return res.status(200).json([]);
    }

    // Get all users who are 1st level connections and NOT in stealth mode
    const firstLevelUsers = await User.find({
      personId: { $in: firstLevelPersonIds.map((id) => new mongoose.Types.ObjectId(id)) },
    }).lean();

    // Filter out users in stealth mode
    const users = firstLevelUsers as { _id: unknown; stealthMode?: boolean }[];
    const nonStealthUserIds = users
      .filter((u) => !u.stealthMode)
      .map((u) => String(u._id));

    // Get updates from non-stealth 1st level connections
    // Updates are for persons that the caller has in their network
    const updates = await UpdateEvent.find({
      fromUserId: { $in: nonStealthUserIds },
      personId: { $in: firstLevelPersonIds.map((id) => new mongoose.Types.ObjectId(id)) },
      applied: false,
      stealth: true, // Only show stealth updates (pending approval)
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Get person details and aliases
    const personIds = [...new Set(updates.map((u) => u.personId?.toString()).filter(Boolean))];
    const persons = await Person.find({ _id: { $in: personIds.map((id) => new mongoose.Types.ObjectId(id)) } }).lean();
    const personMap: Record<string, any> = {};
    persons.forEach((p) => {
      personMap[p._id.toString()] = p;
    });

    // Get aliases for the caller
    const aliases = await ContactAlias.find({
      userId: user.sub,
      personId: { $in: personIds.map((id) => new mongoose.Types.ObjectId(id)) },
    }).lean();
    const aliasMap: Record<string, string> = {};
    aliases.forEach((a) => {
      aliasMap[a.personId.toString()] = a.alias;
    });

    // Get fromUser details
    const fromUserIds = [...new Set(updates.map((u) => u.fromUserId).filter(Boolean))];
    const fromUsers = await User.find({ _id: { $in: fromUserIds } })
      .populate('personId', 'phones emails')
      .lean();
    const fromUserMap: Record<string, any> = {};
    (fromUsers as { _id: unknown }[]).forEach((u) => {
      fromUserMap[String(u._id)] = u;
    });

    type UpdateDoc = { _id: unknown; personId?: unknown; fromUserId?: string; field?: string; oldValue?: string; newValue?: string; createdAt?: Date };
    const enrichedUpdates = (updates as UpdateDoc[]).map((update) => {
      const person = personMap[String(update.personId || '')];
      const fromUser = fromUserMap[update.fromUserId || ''];
      const fromPerson = fromUser?.personId;

      return {
        id: String(update._id),
        personId: update.personId != null ? String(update.personId) : undefined,
        personName: aliasMap[String(update.personId || '')] || (person as any)?.emails?.[0]?.value || (person as any)?.phones?.[0]?.value || 'Unknown',
        fromUserId: update.fromUserId,
        fromUserName: (fromPerson as any)?.emails?.[0]?.value || (fromPerson as any)?.phones?.[0]?.value || 'Unknown',
        field: update.field,
        oldValue: update.oldValue,
        newValue: update.newValue,
        createdAt: update.createdAt,
        isRegistered: !!(person as any)?.registeredUserId,
      };
    });

    return res.status(200).json(enrichedUpdates);
  } catch (err: any) {
    console.error('Network updates error:', err);
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch network updates' });
  }
}

export default withAuth(handler);


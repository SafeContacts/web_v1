// pages/api/updates/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { connect } from '../../../lib/mongodb';
import UpdateEvent from '../../../models/UpdateEvent';
import Contact from '../../../models/Contact';
import { withAuth } from '../../../lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  // Ensure database connection
  if (mongoose.connection.readyState === 0) {
    await connect();
  }

  const user: any = (req as any).user;
  const userId = user?.sub;

  // Fetch the latest 50 stealth update events for the user's contacts
  const events = await UpdateEvent.find({ stealth: true })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  type EventDoc = { _id: unknown; contactId: unknown; field?: string; oldValue?: string; newValue?: string; createdAt?: Date };
  const withContact = await Promise.all((events as EventDoc[]).map(async (e) => {
    const c = await Contact.findById(e.contactId).lean() as { userId?: string; name?: string } | null | undefined;
    if (userId && c && c.userId !== userId) {
      return null;
    }
    return {
      id: String(e._id),
      contactId: String(e.contactId),
      contactName: c?.name || 'Unknown',
      field: e.field,
      oldValue: e.oldValue,
      newValue: e.newValue,
      createdAt: e.createdAt
    };
  }));

  // Filter out null values
  const filtered = withContact.filter(e => e !== null);

  res.status(200).json(filtered);
}

export default withAuth(handler);


// pages/api/updates/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import UpdateEvent from '../../../models/UpdateEvent';
import { Contact } from '../../../models/Contact';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  await connect();

  // Fetch the latest 50 stealth update events, joined with contact info
  const events = await UpdateEvent.find({ stealth: true })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // Optionally populate contact’s name/phone
  const withContact = await Promise.all(events.map(async (e) => {
    const c = await Contact.findById(e.contactId).lean();
    return {
      id:       e._id,
      contactId: e.contactId,
      contactName: c?.name || 'Unknown',
      field:    e.field,
      oldValue: e.oldValue,
      newValue: e.newValue,
      createdAt: e.createdAt
    };
  }));

  res.status(200).json(withContact);
}


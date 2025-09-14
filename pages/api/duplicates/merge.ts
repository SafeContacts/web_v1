// pages/api/duplicates/merge.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }                            from '../../../lib/mongodb';
import Contact                                from '../../../models/Contact';
import UpdateEvent                            from '../../../models/UpdateEvent';
import CallLog                                from '../../../models/CallLog';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connect();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { group } = req.body as { group: string[] };
  if (!Array.isArray(group) || group.length < 2) {
    return res.status(400).json({ error: 'Provide an array of ≥2 contact IDs' });
  }

  // 1) Load all contacts in the group
  const contacts = await Contact.find({ _id: { $in: group } }).lean();
  if (contacts.length < 2) {
    return res.status(404).json({ error: 'Not enough contacts found to merge' });
  }

  // 2) Pick the contact with highest confidenceScore
  contacts.sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0));
  const keeper = contacts[0];
  const others = contacts.slice(1).map(c => c._id.toString());

  // 3) Reassign any UpdateEvents & CallLogs from others → keeper
  await UpdateEvent.updateMany(
    { contactId: { $in: others } },
    { $set: { contactId: keeper._id } }
  );
  await CallLog.updateMany(
    { contactId: { $in: others } },
    { $set: { contactId: keeper._id } }
  );

  // 4) Delete the now-merged contacts
  await Contact.deleteMany({ _id: { $in: others } });

  return res.status(200).json({ mergedId: keeper._id });
}


import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth }      from '../../../src/middleware/requireAuth';
import { connect }          from '../../../lib/mongodb';
import Contact              from '../../../models/Contact';
import SyncSnapshot         from '../../../models/SyncSnapshot';
import UpdateEvent          from '../../../models/UpdateEvent';

/**
 * Sync API
 *
 * This endpoint accepts an array of contacts from the client (device) and computes
 * differences against the server-side contact list. For existing contacts, it logs
 * stealth UpdateEvent documents whenever a tracked field changes. For new contacts it
 * creates a Contact document. The raw contacts are stored in a SyncSnapshot per-user.
 */
export default requireAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { sub: userId } = (req as any).user;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { contacts } = req.body as { contacts: any[] };
  if (!Array.isArray(contacts)) {
    return res.status(400).json({ error: 'Expected contacts to be an array' });
  }

  // Fetch or create a snapshot for this user
  let snapshot = await SyncSnapshot.findOne({ userId });
  if (!snapshot) {
    snapshot = await SyncSnapshot.create({ userId, contacts: [] });
  }

  let updatesCount = 0;

  for (const incoming of contacts) {
    const { phone, name, email, company, address, jobTitle, birthday } = incoming || {};
    if (!phone) {
      // Skip entries without a phone; phone is our primary key
      continue;
    }
    const existing = await Contact.findOne({ phone }).lean();
    if (existing) {
      // Compare each tracked field and log stealth events when values change
      const fields: { key: string; newVal: any; oldVal: any }[] = [
        { key: 'name',     newVal: name,    oldVal: existing.name },
        { key: 'email',    newVal: email,   oldVal: existing.email },
        { key: 'company',  newVal: company, oldVal: existing.company },
        { key: 'address',  newVal: address, oldVal: existing.address },
        { key: 'jobTitle', newVal: jobTitle, oldVal: existing.jobTitle },
        { key: 'birthday', newVal: birthday, oldVal: existing.birthday },
      ];
      for (const f of fields) {
        if (f.newVal != null && f.newVal !== f.oldVal) {
          await UpdateEvent.create({
            contactId: existing._id,
            field: f.key,
            oldValue: f.oldVal ?? '',
            newValue: f.newVal,
            stealth: true,
          });
          updatesCount;
        }
      }
    } else {
      // If contact doesn't exist, create it with a reference to this user
      await Contact.create({
        phone,
        name:     name || '',
        email:    email || '',
        company:  company || '',
        address:  address || '',
        jobTitle: jobTitle || '',
        birthday: birthday ? new Date(birthday) : undefined,
        userRef:  userId,
      });
    }
  }

  // Replace the user's snapshot with the new contacts list and update timestamp
  snapshot.contacts = contacts;
  snapshot.updatedAt = new Date();
  await snapshot.save();

  return res.status(200).json({ message: 'Sync completed', updates: updatesCount });
});


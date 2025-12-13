/*** File: safecontacts/pages/api/sync/index.ts */
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { connect } from '../../../lib/mongodb';
import Contact from '../../../models/Contact';
import UpdateEvent from '../../../models/UpdateEvent';
import { SyncSnapshot } from '../../../models/SyncSnapshot';
import { withAuth } from '../../../lib/auth';

/**
 * Sync endpoint for device contacts.  Clients should POST a JSON payload with
 * the user's contact list (names, phone numbers, emails, addresses, etc.).  The
 * server will compare the incoming list against the last saved snapshot for
 * that user, update or insert Contact documents as needed, record update
 * events for changed fields, and persist the new snapshot.  The response
 * includes counts of inserted and updated contacts.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method !== 'POST') {
    return res.setHeader('Allow', ['POST']).status(405).end(`Method ${method} Not Allowed`);
  }
  
  // Ensure database connection
  if (mongoose.connection.readyState === 0) {
    await connect();
  }
  
  const user: any = (req as any).user;
  const authUserId: string | undefined = user?.sub;
  const { contacts: incomingContacts, userId: bodyUserId } = req.body;
  const userId: string | undefined = authUserId || bodyUserId;
  if (!userId || !Array.isArray(incomingContacts)) {
    return res.status(400).json({ error: 'userId and contacts array are required' });
  }
  // Fetch existing contacts for this user
  const existingContacts = await Contact.find({ userId }).lean();
  // Build a map of normalized primary phone -> existing contact
  const existingMap: Record<string, any> = {};
  existingContacts.forEach((c) => {
    const phone = c.phones?.[0]?.value;
    if (phone) {
      const normalized = phone.replace(/\D/g, '');
      if (normalized) existingMap[normalized] = c;
    }
  });
  let inserted = 0;
  let updated = 0;
  const snapshotContacts: any[] = [];
  for (const rawContact of incomingContacts) {
    const { name, phones = [], emails = [], addresses = [], notes } = rawContact;
    const primaryPhoneObj = phones[0];
    const normalized = primaryPhoneObj?.value ? String(primaryPhoneObj.value).replace(/\D/g, '') : '';
    const sanitizedPhones = phones.map((p: any) => ({ label: p.label || 'mobile', value: String(p.value) }));
    const sanitizedEmails = emails.map((e: any) => ({ label: e.label || 'work', value: String(e.value).toLowerCase().trim() }));
    // Addresses in Contact model are just strings, not objects
    const sanitizedAddresses = addresses.map((a: any) => typeof a === 'string' ? a : (a?.value || a?.label || String(a)));
    // For snapshot, keep addresses as they are (can be objects)
    const snapshotObj = { name, phones: sanitizedPhones, emails: sanitizedEmails, addresses: sanitizedAddresses, notes: notes || '' };
    snapshotContacts.push(snapshotObj);
    if (!normalized) {
      continue;
    }
    const existing = existingMap[normalized];
    if (existing) {
      const updates: any = {};
      if (existing.name !== name && name) {
        updates.name = name;
        await UpdateEvent.create({ contactId: existing._id, userId, field: 'name', oldValue: existing.name, newValue: name });
      }
      const existingPrimaryPhone = existing.phones?.[0]?.value;
      if (existingPrimaryPhone && existingPrimaryPhone.replace(/\D/g, '') !== normalized) {
        updates.phones = sanitizedPhones;
        await UpdateEvent.create({ contactId: existing._id, userId, field: 'phones', oldValue: existing.phones, newValue: sanitizedPhones });
      }
      if (JSON.stringify(existing.emails || []) !== JSON.stringify(sanitizedEmails)) {
        updates.emails = sanitizedEmails;
        await UpdateEvent.create({ contactId: existing._id, userId, field: 'emails', oldValue: existing.emails, newValue: sanitizedEmails });
      }
      if (JSON.stringify(existing.addresses || []) !== JSON.stringify(sanitizedAddresses)) {
        updates.addresses = sanitizedAddresses;
        await UpdateEvent.create({ contactId: existing._id, userId, field: 'addresses', oldValue: existing.addresses, newValue: sanitizedAddresses });
      }
      if ((existing.notes || '') !== (notes || '')) {
        updates.notes = notes || '';
        await UpdateEvent.create({ contactId: existing._id, userId, field: 'notes', oldValue: existing.notes, newValue: notes || '' });
      }
      if (Object.keys(updates).length > 0) {
        updated++;
        await Contact.findByIdAndUpdate(existing._id, updates);
      }
    } else {
      inserted++;
      await Contact.create({
        userId,
        name: name || '(unknown)',
        phones: sanitizedPhones,
        emails: sanitizedEmails,
        addresses: sanitizedAddresses,
        notes: notes || '',
        trustScore: 0,
      });
    }
  }
  await SyncSnapshot.findOneAndUpdate(
    { userId },
    { contacts: snapshotContacts },
    { upsert: true, setDefaultsOnInsert: true }
  );
  return res.status(200).json({ inserted, updated, count: incomingContacts.length });
}

export default withAuth(handler);



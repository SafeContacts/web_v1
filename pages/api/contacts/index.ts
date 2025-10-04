/*** Add File: safecontacts/pages/api/contacts/index.ts */
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import { Contact } from '../../../models/Contact';
import { requireAuth } from '../../../src/middleware/requireAuth';

/**
 * API route for managing a user's contacts.  Supports GET to fetch contacts
 * and POST to create a new contact.  The userId is derived from the
 * authenticated token if present; admin callers may pass a userId query
 * parameter to fetch another user's contacts.  When creating contacts,
 * callers may provide userId in the request body when no token is present
 * (useful for demonstrations).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { method } = req;
  switch (method) {
    case 'GET': {
      // Attempt to authenticate; allow admin callers to specify a userId query.
      let authUserId: string | undefined = undefined;
      try {
        await requireAuth(req, res);
        authUserId = (req as any).user?.sub;
      } catch (err) {
        // no token provided; proceed with query parameter only
      }
      const { userId } = req.query;
      const targetUserId = typeof userId === 'string' ? userId : authUserId;
      if (!targetUserId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const contacts = await Contact.find({ userId: targetUserId }).lean();
      return res.status(200).json(contacts);
    }
    case 'POST': {
      // Create a new contact.  Require authentication or explicit userId in body.
      let authUserId: string | undefined;
      try {
        await requireAuth(req, res);
        authUserId = (req as any).user?.sub;
      } catch (err) {
        // no token; we will allow userId in body
      }
      const { name, phones, emails, addresses, notes, userId: bodyUserId } = req.body;
      const ownerId: string | undefined = authUserId || bodyUserId;
      if (!ownerId) {
        return res.status(401).json({ error: 'User must be authenticated or provide userId' });
      }
      if (!name || !Array.isArray(phones) || phones.length === 0) {
        return res.status(400).json({ error: 'Name and at least one phone are required' });
      }
      const sanitizedPhones = phones.map((p: any) => ({ label: p.label || '', value: p.value }));
      const sanitizedEmails = Array.isArray(emails)
        ? emails.map((e: any) => ({ label: e.label || '', value: e.value }))
        : [];
      const sanitizedAddresses = Array.isArray(addresses)
        ? addresses.map((a: any) => ({ label: a.label || '', value: a.value }))
        : [];
      const contact = await Contact.create({
        userId: ownerId,
        name,
        phones: sanitizedPhones,
        emails: sanitizedEmails,
        addresses: sanitizedAddresses,
        notes: notes || '',
        trustScore: 0,
      });
      return res.status(201).json(contact);
    }
    default:
      return res.setHeader('Allow', ['GET', 'POST']).status(405).end(`Method ${method} Not Allowed`);
  }
}


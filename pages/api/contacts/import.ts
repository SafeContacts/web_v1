// pages/api/contacts/import.ts
// API to import contacts with encryption
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { withAuth } from '../../../lib/auth';
import Contact from '../../../models/Contact';
import Person from '../../../models/Person';
import ContactAlias from '../../../models/ContactAlias';
import ContactEdge from '../../../models/ContactEdge';
import User from '../../../models/User';
import { encryptContactData } from '../../../lib/encryption';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
  }

  try {
    const { contacts } = req.body;
    
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'contacts must be an array' });
    }

    const caller = await User.findById(user.sub).lean();
    if (!caller || !caller.personId) {
      return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Person not found for user' });
    }
    const fromPersonId = caller.personId;

    let imported = 0;
    let updated = 0;
    const errors: any[] = [];

    // Helper to normalize phone
    const toE164 = (phone: string): string => {
      const digits = phone.replace(/\D/g, '');
      if (digits.startsWith('1') && digits.length === 11) return '+' + digits;
      if (digits.length === 10) return '+1' + digits;
      return '+' + digits;
    };

    for (const contactData of contacts) {
      try {
        const { name, phones, emails, addresses, notes } = contactData;
        
        if (!name || !phones || phones.length === 0) {
          errors.push({ contact: contactData, error: 'Name and at least one phone required' });
          continue;
        }

        const primaryPhone = phones[0].value;
        const phoneE164 = toE164(primaryPhone);
        const emailValue = emails?.[0]?.value?.toLowerCase().trim();

        // Find or create Person
        let person = await Person.findOne({
          $or: [
            { 'phones.e164': phoneE164 },
            { 'phones.value': primaryPhone },
            ...(emailValue ? [{ 'emails.value': emailValue }] : []),
          ],
        }).lean();

        if (!person) {
          person = await Person.create({
            phones: phones.map((p: any) => ({
              label: p.label || 'mobile',
              value: p.value,
              e164: toE164(p.value),
            })),
            emails: (emails || []).map((e: any) => ({
              label: e.label || 'work',
              value: e.value.toLowerCase().trim(),
            })),
            addresses: addresses || [],
          });
        }

        // Check if contact already exists
        const existingContact = await Contact.findOne({
          userId: user.sub,
          'phones.value': primaryPhone,
        }).lean();

        // Encrypt contact data before saving
        const encryptedData = encryptContactData({
          name,
          phones,
          emails: emails || [],
          addresses: addresses || [],
          notes: notes || '',
        });

        if (existingContact) {
          // Update existing contact
          await Contact.findByIdAndUpdate(existingContact._id, encryptedData);
          updated++;
        } else {
          // Create new contact
          await Contact.create({
            userId: user.sub,
            ...encryptedData,
            trustScore: 0,
          });
          imported++;
        }

        // Create ContactAlias
        await ContactAlias.findOneAndUpdate(
          { userId: user.sub, personId: person._id },
          { alias: name, tags: [], notes: notes || '' },
          { upsert: true, new: true }
        );

        // Create ContactEdge
        await ContactEdge.findOneAndUpdate(
          { fromPersonId, toPersonId: person._id },
          { $inc: { weight: 1 }, lastContactedAt: new Date() },
          { upsert: true, new: true }
        );
      } catch (err: any) {
        errors.push({ contact: contactData, error: err.message });
      }
    }

    return res.status(200).json({
      ok: true,
      imported,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('Import contacts error:', err);
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to import contacts' });
  }
}

export default withAuth(handler);


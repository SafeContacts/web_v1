// pages/api/updates/[id]/apply.ts
// API to apply a network update
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { withAuth } from '../../../../lib/auth';
import UpdateEvent from '../../../../models/UpdateEvent';
import Person from '../../../../models/Person';
import Contact from '../../../../models/Contact';
import ContactAlias from '../../../../models/ContactAlias';
import User from '../../../../models/User';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
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
    const { id } = req.query as { id: string };
    const { personId, field, newValue, ignore } = req.body;

    // Get the update event
    const updateEvent = await UpdateEvent.findById(id);
    if (!updateEvent) {
      return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Update event not found' });
    }

    // Verify user has permission (should be a 1st level connection)
    const caller = await User.findById(user.sub).lean();
    if (!caller || !caller.personId) {
      return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Person not found for user' });
    }

    // Mark as applied
    updateEvent.applied = true;
    await updateEvent.save();

    if (!ignore) {
      // Apply the update to Person
      const person = await Person.findById(updateEvent.personId);
      if (person) {
        if (field === 'phones') {
          person.phones = Array.isArray(newValue) ? newValue : JSON.parse(newValue);
        } else if (field === 'emails') {
          person.emails = Array.isArray(newValue) ? newValue : JSON.parse(newValue);
        } else if (field === 'addresses') {
          person.addresses = Array.isArray(newValue) ? newValue : JSON.parse(newValue);
        } else {
          (person as any)[field] = newValue;
        }
        await person.save();

        // Also update the user's Contact if it exists
        const alias = await ContactAlias.findOne({
          userId: user.sub,
          personId: person._id,
        }).lean();

        if (alias) {
          // Find Contact by matching phone
          const primaryPhone = person.phones?.[0]?.value;
          if (primaryPhone) {
            const phoneE164 = '+' + primaryPhone.replace(/\D/g, '');
            const contact = await Contact.findOne({
              userId: user.sub,
              $or: [
                { 'phones.value': primaryPhone },
                { 'phones.value': phoneE164 },
              ],
            });

            if (contact) {
              if (field === 'phones') {
                contact.phones = Array.isArray(newValue) ? newValue : JSON.parse(newValue);
              } else if (field === 'emails') {
                contact.emails = Array.isArray(newValue) ? newValue : JSON.parse(newValue);
              } else if (field === 'addresses') {
                contact.addresses = Array.isArray(newValue) ? newValue : JSON.parse(newValue);
              }
              await contact.save();
            }
          }
        }
      }
    }

    return res.status(200).json({
      ok: true,
      message: ignore ? 'Update ignored' : 'Update applied successfully',
    });
  } catch (err: any) {
    console.error('Apply update error:', err);
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to apply update' });
  }
}

export default withAuth(handler);


// pages/api/contacts/[id]/update-person.ts
// API to update a Person and create UpdateEvents for network
// Handles registered vs non-registered users intelligently
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { withAuth } from '../../../../lib/auth';
import Contact from '../../../../models/Contact';
import Person from '../../../../models/Person';
import UpdateEvent from '../../../../models/UpdateEvent';
import ContactEdge from '../../../../models/ContactEdge';
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
    const { field, newValue } = req.body;

    if (!field || newValue === undefined) {
      return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'field and newValue are required' });
    }

    // Get the contact
    const contact = await Contact.findById(id).lean();
    if (!contact) {
      return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Contact not found' });
    }

    if (contact.userId !== user.sub && user.role !== 'admin') {
      return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'Not authorized to update this contact' });
    }

    // Find the Person associated with this contact
    const primaryPhone = contact.phones?.[0]?.value;
    if (!primaryPhone) {
      return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'Contact has no phone number' });
    }

    const phoneE164 = '+' + primaryPhone.replace(/\D/g, '');
    const emailValue = contact.emails?.[0]?.value?.toLowerCase().trim();

    let person = await Person.findOne({
      $or: [
        { 'phones.e164': phoneE164 },
        { 'phones.value': primaryPhone },
        ...(emailValue ? [{ 'emails.value': emailValue }] : []),
      ],
    });

    if (!person) {
      return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Person not found for this contact' });
    }

    // Get old value
    let oldValue: any;
    if (field === 'phones') {
      oldValue = JSON.stringify(person.phones || []);
    } else if (field === 'emails') {
      oldValue = JSON.stringify(person.emails || []);
    } else if (field === 'addresses') {
      oldValue = JSON.stringify(person.addresses || []);
    } else {
      oldValue = (person as any)[field] || '';
    }

    // Check if person is registered
    const isRegistered = !!person.registeredUserId;

    if (isRegistered) {
      // For registered users, update Person directly (no approval needed)
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

      // Also update the Contact
      await Contact.findByIdAndUpdate(id, { [field]: newValue });

      return res.status(200).json({
        ok: true,
        message: 'Person updated directly (registered user)',
        person: person,
      });
    } else {
      // For non-registered users, create UpdateEvent for network
      // Get user's stealth mode
      const fromUser = await User.findById(user.sub).lean();
      const isStealth = fromUser?.stealthMode || false;

      // Update the Contact first
      await Contact.findByIdAndUpdate(id, { [field]: newValue });

      // Create UpdateEvent (stealth = true means it needs approval from 1st connections)
      const updateEvent = await UpdateEvent.create({
        personId: person._id,
        fromUserId: user.sub,
        field,
        oldValue: String(oldValue),
        newValue: Array.isArray(newValue) ? JSON.stringify(newValue) : String(newValue),
        stealth: !isStealth, // If user is NOT in stealth, create visible update
        applied: false,
      });

      // Find all users who have this person as a contact (1st level connections)
      // Get all ContactEdges pointing to this person
      const edgesToPerson = await ContactEdge.find({ toPersonId: person._id }).lean();
      const connectedPersonIds = edgesToPerson.map((e) => e.fromPersonId.toString());

      // Get all users who have this person as a contact
      const connectedUsers = await User.find({
        personId: { $in: connectedPersonIds.map((id) => new mongoose.Types.ObjectId(id)) },
      }).lean();

      // For each connected user, they will see this update in their network updates
      // (if the fromUser is not in stealth mode and they are 1st level connections)

      return res.status(201).json({
        ok: true,
        message: 'Update event created for network',
        updateEvent: {
          id: updateEvent._id.toString(),
          personId: person._id.toString(),
          field,
          oldValue,
          newValue,
          stealth: updateEvent.stealth,
        },
        affectedUsers: connectedUsers.length,
      });
    }
  } catch (err: any) {
    console.error('Update person error:', err);
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to update person' });
  }
}

export default withAuth(handler);


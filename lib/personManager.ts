// lib/personManager.ts
// Helper functions for managing Person nodes and ContactEdges when editing contacts

import mongoose from 'mongoose';
import Person from '../models/Person';
import ContactEdge from '../models/ContactEdge';
import ContactAlias from '../models/ContactAlias';
import User from '../models/User';

/**
 * Normalize phone to E.164 format
 */
function toE164(phone: string, countryCode: string = '+91'): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+')) {
    return '+' + digits;
  }
  const ccDigits = countryCode.replace(/\D/g, '');
  return `+${ccDigits}${digits}`;
}

/**
 * Find or create a Person node based on phone and/or email
 * Uses email as primary identifier if available
 */
export async function findOrCreatePerson(
  phone?: string,
  email?: string,
  countryCode: string = '+91'
): Promise<any> {
  if (!phone && !email) {
    throw new Error('Phone or email required to find/create Person');
  }

  const phoneE164 = phone ? toE164(phone, countryCode) : null;
  const emailValue = email ? email.toLowerCase().trim() : null;

  // Strategy 1: If email exists, find by email first (same person)
  if (emailValue) {
    const personByEmail = await Person.findOne({
      'emails.value': emailValue,
    }).lean();

    if (personByEmail) {
      // Found by email - check if phone needs to be added
      if (phoneE164 && !personByEmail.phones?.some((p: any) => p.e164 === phoneE164 || p.value === phone)) {
        // Add phone to existing Person
        await Person.findByIdAndUpdate(personByEmail._id, {
          $push: {
            phones: {
              label: 'mobile',
              value: phone,
              e164: phoneE164,
              countryCode: countryCode,
            },
          },
        });
      }
      return await Person.findById(personByEmail._id);
    }
  }

  // Strategy 2: Find by phone
  if (phoneE164) {
    const personByPhone = await Person.findOne({
      $or: [
        { 'phones.e164': phoneE164 },
        { 'phones.value': phone },
      ],
    }).lean();

    if (personByPhone) {
      // Found by phone - check if email needs to be added
      if (emailValue && !personByPhone.emails?.some((e: any) => e.value === emailValue)) {
        await Person.findByIdAndUpdate(personByPhone._id, {
          $push: {
            emails: {
              label: 'work',
              value: emailValue,
            },
          },
        });
      }
      return await Person.findById(personByPhone._id);
    }
  }

  // Strategy 3: Create new Person
  const personData: any = {
    phones: phone ? [{
      label: 'mobile',
      value: phone,
      e164: phoneE164,
      countryCode: countryCode,
    }] : [],
    emails: emailValue ? [{
      label: 'work',
      value: emailValue,
    }] : [],
    addresses: [],
  };

  return await Person.create(personData);
}

/**
 * Link a contact to a Person node (create ContactEdge and ContactAlias)
 */
export async function linkContactToPerson(
  contactId: string,
  personId: any,
  userId: string,
  alias: string,
  notes: string = ''
): Promise<void> {
  // Get user's personId
  const user = await User.findById(userId).lean();
  if (!user || !user.personId) {
    throw new Error('User does not have a Person node');
  }

  const fromPersonId = user.personId;
  const toPersonId = personId;

  // Create or update ContactEdge
  await ContactEdge.findOneAndUpdate(
    { fromPersonId, toPersonId },
    { $inc: { weight: 1 }, lastContactedAt: new Date() },
    { upsert: true, new: true }
  );

  // Create or update ContactAlias
  await ContactAlias.findOneAndUpdate(
    { userId, personId: toPersonId },
    { alias, tags: [], notes },
    { upsert: true, new: true }
  );
}

/**
 * Unlink a contact from a Person node (remove ContactEdge and ContactAlias)
 * Only removes if Person has no other connections
 */
export async function unlinkContactFromPerson(
  contactId: string,
  personId: any,
  userId: string
): Promise<void> {
  const user = await User.findById(userId).lean();
  if (!user || !user.personId) {
    return;
  }

  const fromPersonId = user.personId;
  const toPersonId = personId;

  // Remove ContactEdge
  await ContactEdge.findOneAndDelete({ fromPersonId, toPersonId });

  // Remove ContactAlias
  await ContactAlias.findOneAndDelete({ userId, personId: toPersonId });
}

/**
 * Get all Person nodes linked to a contact
 */
export async function getContactPersonNodes(
  contactId: string,
  userId: string
): Promise<any[]> {
  // Find all ContactAliases for this contact's alias name
  const contact = await mongoose.models.Contact.findById(contactId).lean();
  if (!contact) return [];

  const aliases = await ContactAlias.find({
    userId,
    alias: contact.name,
  }).lean();

  const personIds = aliases.map((a) => a.personId);
  if (personIds.length === 0) return [];

  return await Person.find({ _id: { $in: personIds } }).lean();
}

/**
 * Process contact phone/email changes and update Person nodes accordingly
 */
export async function processContactChanges(
  contactId: string,
  userId: string,
  oldPhones: any[],
  newPhones: any[],
  oldEmails: any[],
  newEmails: any[],
  alias: string,
  notes: string = ''
): Promise<{ created: any[]; removed: any[]; updated: any[] }> {
  const oldPhoneValues = (oldPhones || []).map((p: any) => p.value).filter(Boolean);
  const newPhoneValues = (newPhones || []).map((p: any) => p.value).filter(Boolean);
  const oldEmailValues = (oldEmails || []).map((e: any) => e.value).filter(Boolean);
  const newEmailValues = (newEmails || []).map((e: any) => e.value).filter(Boolean);

  const removedPhones = oldPhoneValues.filter((p) => !newPhoneValues.includes(p));
  const addedPhones = newPhoneValues.filter((p) => !oldPhoneValues.includes(p));
  const removedEmails = oldEmailValues.filter((e) => !newEmailValues.includes(e));
  const addedEmails = newEmailValues.filter((e) => !oldEmailValues.includes(e));

  const created: any[] = [];
  const removed: any[] = [];
  const updated: any[] = [];

  // Process added phones
  for (const phoneData of newPhones) {
    if (addedPhones.includes(phoneData.value)) {
      const countryCode = phoneData.countryCode || '+91';
      const email = newEmails?.[0]?.value;
      
      const person = await findOrCreatePerson(phoneData.value, email, countryCode);
      await linkContactToPerson(contactId, person._id, userId, alias, notes);
      created.push(person);
    }
  }

  // Process existing phones (may need Person update if email changed)
  for (const phoneData of newPhones) {
    if (!addedPhones.includes(phoneData.value)) {
      const countryCode = phoneData.countryCode || '+91';
      const email = newEmails?.[0]?.value;
      
      const person = await findOrCreatePerson(phoneData.value, email, countryCode);
      await linkContactToPerson(contactId, person._id, userId, alias, notes);
      updated.push(person);
    }
  }

  // Process removed phones (optional cleanup)
  for (const phone of removedPhones) {
    const phoneE164 = toE164(phone);
    const person = await Person.findOne({
      $or: [
        { 'phones.e164': phoneE164 },
        { 'phones.value': phone },
      ],
    }).lean();

    if (person) {
      // Check if Person has other connections
      const otherEdges = await ContactEdge.find({
        $or: [
          { fromPersonId: person._id },
          { toPersonId: person._id },
        ],
      }).lean();

      // Only remove if Person has no other connections and no email
      if (otherEdges.length <= 1 && (!person.emails || person.emails.length === 0)) {
        await unlinkContactFromPerson(contactId, person._id, userId);
        removed.push(person);
      }
    }
  }

  return { created, removed, updated };
}


/* FILE:: pages/api/contacts/[id].ts */

import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Contact from "../../../models/Contact";
import { withAuth } from "../../../lib/auth";
import { connect }             from '../../../lib/mongodb'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const user: any = (req as any).user;
  const { id } = req.query as { id: string };
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: "UNAUTHORIZED" });
  }
  if (mongoose.connection.readyState === 0) {
     await connect()
  }
  const contact = await Contact.findById(id);
  if (!contact) {
    return res.status(404).json({ ok: false, code: "NOT_FOUND" });
  }
  if (contact.userId !== user.sub && user.role !== "admin") {
    return res.status(403).json({ ok: false, code: "FORBIDDEN" });
  }
  switch (method) {
    case "GET": {
      return res.status(200).json(contact);
    }
    case "PUT":
    case "PATCH": {
      const allowed = [
        "name",
        "phones",
        "emails",
        "addresses",
        "notes",
        "company",
        "tags",
        "linkedIn",
        "twitter",
        "instagram",
      ];
      
      // Track what fields changed
      const changes: Record<string, { old: any; new: any }> = {};
      
      for (const key of Object.keys(req.body)) {
        if (allowed.includes(key)) {
          const oldValue = (contact as any)[key];
          const newValue = req.body[key];
          
          // Only track if value actually changed
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[key] = { old: oldValue, new: newValue };
            (contact as any)[key] = newValue;
          }
        }
      }
      
      await contact.save();
      
      // If phones, emails, or addresses changed, also update Person and create UpdateEvents
      if (changes.phones || changes.emails || changes.addresses) {
        try {
          // Import models
          const Person = mongoose.models.Person || (await import("../../../models/Person")).default;
          const UpdateEvent = mongoose.models.UpdateEvent || (await import("../../../models/UpdateEvent")).default;
          const User = mongoose.models.User || (await import("../../../models/User")).default;
          
          // Find Person by phone
          const primaryPhone = contact.phones?.[0]?.value;
          if (primaryPhone) {
            const phoneE164 = '+' + primaryPhone.replace(/\D/g, '');
            const person = await Person.findOne({
              $or: [
                { 'phones.e164': phoneE164 },
                { 'phones.value': primaryPhone },
              ],
            });
            
            if (person) {
              const fromUser = await User.findById(user.sub).lean();
              const isStealth = fromUser?.stealthMode || false;
              
              // Update Person
              if (changes.phones) {
                person.phones = contact.phones.map((p: any) => ({
                  label: p.label || 'mobile',
                  value: p.value,
                  e164: '+' + p.value.replace(/\D/g, ''),
                }));
              }
              if (changes.emails) {
                person.emails = contact.emails.map((e: any) => ({
                  label: e.label || 'work',
                  value: e.value.toLowerCase().trim(),
                }));
              }
              if (changes.addresses) {
                person.addresses = contact.addresses;
              }
              
              // If person is registered, save directly
              if (person.registeredUserId) {
                await person.save();
              } else {
                // For non-registered, create UpdateEvent
                for (const [field, change] of Object.entries(changes)) {
                  if (['phones', 'emails', 'addresses'].includes(field)) {
                    await UpdateEvent.create({
                      personId: person._id,
                      fromUserId: user.sub,
                      field,
                      oldValue: JSON.stringify(change.old),
                      newValue: JSON.stringify(change.new),
                      stealth: !isStealth,
                      applied: false,
                    });
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('Failed to update Person or create UpdateEvent:', err);
          // Don't fail the request, just log the error
        }
      }
      
      return res.status(200).json(contact);
    }
    default:
      res.setHeader("Allow", ["GET", "PUT", "PATCH"]);
      return res.status(405).end();
  }
}

export default withAuth(handler);

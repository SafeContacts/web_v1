/*** Add File: safecontacts/pages/api/contacts/index.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../../lib/auth";
import mongoose from "mongoose";
import Contact from "../../../models/Contact";
import User from "../../../models/User";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: "UNAUTHORIZED" });
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }
  switch (method) {
    case "GET": {
      const queryUserId = req.query.userId as string | undefined;
      let userId = user.sub as string;
      if (queryUserId && queryUserId !== userId) {
        if (user.role === "admin") {
          userId = queryUserId;
        } else {
          return res.status(403).json({ ok: false, code: "FORBIDDEN", message: "Not authorized to access other users' contacts" });
        }
      }
      const contacts = await Contact.find({ userId }).lean();
      return res.status(200).json(contacts);
    }
    case "POST": {
      const { name, phones, emails, addresses, notes, linkedIn, twitter, instagram } = req.body;
      if (!name || !phones || !Array.isArray(phones) || phones.length === 0) {
        return res.status(400).json({ ok: false, code: "VALIDATION_ERROR", message: "Name and at least one phone are required", data: req.body });
      }
      try {
        // Import models
        const Person = mongoose.models.Person || (await import("../../../models/Person")).default;
        const ContactAlias = mongoose.models.ContactAlias || (await import("../../../models/ContactAlias")).default;
        const ContactEdge = mongoose.models.ContactEdge || (await import("../../../models/ContactEdge")).default;
        
        // Helper function to normalize phone to e164 (US format)
        const toE164 = (phone: string): string => {
          const digits = phone.replace(/\D/g, '');
          if (digits.startsWith('1') && digits.length === 11) {
            return '+' + digits;
          }
          if (digits.length === 10) {
            return '+1' + digits;
          }
          return '+' + digits;
        };
        
        // Find or create Person based on phone/email
        const primaryPhone = phones[0].value;
        const phoneE164 = toE164(primaryPhone);
        const emailValue = emails?.[0]?.value?.toLowerCase().trim();
        
        // Search for existing Person by phone or email
        let person = await Person.findOne({
          $or: [
            { "phones.e164": phoneE164 },
            { "phones.value": primaryPhone },
            ...(emailValue ? [{ "emails.value": emailValue }] : []),
          ],
        }).lean();
        
        if (!person) {
          // Create new Person
          const personData: any = {
            phones: phones.map((p: any) => ({
              label: p.label || "mobile",
              value: p.value,
              e164: toE164(p.value),
            })),
            emails: (emails || []).map((e: any) => ({
              label: e.label || "work",
              value: e.value.toLowerCase().trim(),
            })),
            addresses: addresses || [],
            socials: {
              ...(linkedIn ? { linkedIn } : {}),
              ...(twitter ? { twitter } : {}),
              ...(instagram ? { instagram } : {}),
            },
          };
          person = await Person.create(personData);
        }
        
        // Create Contact entry
        const contact = await Contact.create({
          userId: user.sub,
          name,
          phones,
          emails: emails || [],
          addresses: addresses || [],
          notes: notes || "",
          trustScore: 0,
          linkedIn,
          twitter,
          instagram,
        });
        
        // Get user's personId
        const caller = await User.findById(user.sub).lean();
        if (caller && caller.personId) {
          const fromPersonId = caller.personId;
          const toPersonId = person._id;
          
          // Create or update ContactAlias
          await ContactAlias.findOneAndUpdate(
            { userId: user.sub, personId: toPersonId },
            { alias: name, tags: [], notes: notes || "" },
            { upsert: true, new: true }
          );
          
          // Create or update ContactEdge
          await ContactEdge.findOneAndUpdate(
            { fromPersonId, toPersonId },
            { $inc: { weight: 1 }, lastContactedAt: new Date() },
            { upsert: true, new: true }
          );
        }
        
        return res.status(201).json(contact);
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ ok: false, code: "INTERNAL_ERROR", message: "Failed to create contact" });
      }
    }
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

export default withAuth(handler);

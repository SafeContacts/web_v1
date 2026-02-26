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
      // Decrypt contact data for authorized user
      let decryptedContact: any;
      if (contact.decryptForUser) {
        decryptedContact = contact.decryptForUser();
      } else {
        // Fallback: manual decryption
        const { decrypt } = require("../../../lib/encryption");
        const doc = contact.toObject ? contact.toObject() : contact;
        if (doc.encrypted !== false) {
          try {
            if (doc.phones && Array.isArray(doc.phones)) {
              doc.phones = doc.phones.map((p: any) => ({
                ...p,
                value: decrypt(p.value),
              }));
            }
            if (doc.emails && Array.isArray(doc.emails)) {
              doc.emails = doc.emails.map((e: any) => ({
                ...e,
                value: decrypt(e.value),
              }));
            }
            if (doc.addresses && Array.isArray(doc.addresses)) {
              doc.addresses = doc.addresses.map((addr: string) => decrypt(addr));
            }
            if (doc.notes) {
              doc.notes = decrypt(doc.notes);
            }
          } catch (err) {
            console.error('Decryption error:', err);
          }
        }
        decryptedContact = doc;
      }
      return res.status(200).json(decryptedContact);
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
      
      // Get old values before saving (for comparison) - decrypt if needed
      const { decrypt } = require("../../../lib/encryption");
      const decryptPhone = (p: any) => ({
        ...p,
        value: p.value && typeof p.value === 'string' && p.value.match(/^[0-9a-f]{128,}$/i) ? decrypt(p.value) : p.value,
      });
      const decryptEmail = (e: any) => ({
        ...e,
        value: e.value && typeof e.value === 'string' && e.value.match(/^[0-9a-f]{128,}$/i) ? decrypt(e.value) : e.value,
      });
      
      const oldPhones = JSON.parse(JSON.stringify(contact.phones || []));
      const oldEmails = JSON.parse(JSON.stringify(contact.emails || []));
      const oldPhonesDecrypted = oldPhones.map(decryptPhone);
      const oldEmailsDecrypted = oldEmails.map(decryptEmail);
      
      await contact.save();
      
      // If phones or emails changed, manage Person nodes and ContactEdges
      if (changes.phones || changes.emails) {
        try {
          const { processContactChanges } = await import("../../../lib/personManager");
          const UpdateEvent = mongoose.models.UpdateEvent || (await import("../../../models/UpdateEvent")).default;
          const User = mongoose.models.User || (await import("../../../models/User")).default;
          
          // Get new values from request body (they're not encrypted yet, will be encrypted on save)
          // But since we already saved, we need to decrypt them for comparison
          const newPhones = (contact.phones || []).map(decryptPhone);
          const newEmails = (contact.emails || []).map(decryptEmail);
          
          // Process Person node changes
          // Decrypt notes if needed
          let notesDecrypted = contact.notes || '';
          if (notesDecrypted && typeof notesDecrypted === 'string' && notesDecrypted.match(/^[0-9a-f]{128,}$/i)) {
            notesDecrypted = decrypt(notesDecrypted);
          }
          
          const result = await processContactChanges(
            contact._id.toString(),
            user.sub,
            oldPhonesDecrypted,
            newPhones,
            oldEmailsDecrypted,
            newEmails,
            contact.name,
            notesDecrypted
          );
          
          // Create UpdateEvents for network updates (if not stealth mode)
          const fromUser = await User.findById(user.sub).lean() as { stealthMode?: boolean } | null | undefined;
          const isStealth = fromUser?.stealthMode || false;
          
          if (!isStealth) {
            for (const person of [...result.created, ...result.updated]) {
              if (!person.registeredUserId) {
                // Only create UpdateEvents for non-registered persons
                for (const [field, change] of Object.entries(changes)) {
                  if (['phones', 'emails'].includes(field)) {
                    await UpdateEvent.create({
                      personId: person._id,
                      fromUserId: user.sub,
                      field,
                      oldValue: JSON.stringify(change.old),
                      newValue: JSON.stringify(change.new),
                      stealth: false,
                      applied: false,
                    });
                  }
                }
              }
            }
          }
          
          console.log(`Contact ${contact._id} updated:`, {
            created: result.created.length,
            updated: result.updated.length,
            removed: result.removed.length,
          });
        } catch (err) {
          console.error('Failed to process Person node changes:', err);
          // Don't fail the request, just log the error
        }
      }
      
      // If addresses changed, update Person addresses (if Person exists)
      if (changes.addresses && !changes.phones && !changes.emails) {
        try {
          const Person = mongoose.models.Person || (await import("../../../models/Person")).default;
          const ContactAlias = mongoose.models.ContactAlias || (await import("../../../models/ContactAlias")).default;
          
          // Find Person nodes linked to this contact
          const aliases = await ContactAlias.find({
            userId: user.sub,
            alias: contact.name,
          }).lean();
          
          // Update addresses for all linked Person nodes
          for (const alias of aliases) {
            await Person.findByIdAndUpdate(alias.personId, {
              addresses: contact.addresses || [],
            });
          }
        } catch (err) {
          console.error('Failed to update Person addresses:', err);
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

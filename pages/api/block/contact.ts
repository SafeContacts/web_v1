// pages/api/block/contact.ts
// API for blocking and unblocking contacts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../../lib/auth";
import mongoose from "mongoose";
import BlockedContact from "../../../models/BlockedContact";
import Person from "../../../models/Person";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const user: any = (req as any).user;

  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: "UNAUTHORIZED" });
  }

  // Ensure database connection
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  try {
    switch (method) {
      case "POST": {
        // Block a contact
        const { personId, phoneNumber, reason } = req.body;

        if (!personId && !phoneNumber) {
          return res.status(400).json({
            ok: false,
            code: "VALIDATION_ERROR",
            message: "personId or phoneNumber is required",
          });
        }

        // If personId is provided, get phone number from Person
        let finalPhoneNumber = phoneNumber;
        if (personId && !phoneNumber) {
          const person = await Person.findById(personId).lean();
          if (person) {
            finalPhoneNumber = person.phones?.[0]?.value || person.phones?.[0]?.e164;
          }
        }

        // Check if already blocked
        const existingBlock = await BlockedContact.findOne({
          userId: user.sub,
          $or: [{ personId: personId ? new mongoose.Types.ObjectId(personId) : null }, { phoneNumber: finalPhoneNumber }],
        }).lean();

        if (existingBlock) {
          return res.status(400).json({
            ok: false,
            code: "ALREADY_BLOCKED",
            message: "Contact is already blocked",
          });
        }

        // Create block entry
        const block = await BlockedContact.create({
          userId: user.sub,
          personId: personId ? new mongoose.Types.ObjectId(personId) : undefined,
          phoneNumber: finalPhoneNumber,
          reason: reason || "",
        });

        return res.status(201).json({
          ok: true,
          block: {
            id: block._id.toString(),
            personId: block.personId?.toString(),
            phoneNumber: block.phoneNumber,
            blockedAt: block.blockedAt,
          },
        });
      }

      case "DELETE": {
        // Unblock a contact
        const { personId, phoneNumber } = req.query;

        if (!personId && !phoneNumber) {
          return res.status(400).json({
            ok: false,
            code: "VALIDATION_ERROR",
            message: "personId or phoneNumber is required",
          });
        }

        const deleteResult = await BlockedContact.deleteOne({
          userId: user.sub,
          $or: [
            { personId: personId ? new mongoose.Types.ObjectId(personId as string) : null },
            { phoneNumber: phoneNumber as string },
          ],
        });

        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({
            ok: false,
            code: "NOT_FOUND",
            message: "Blocked contact not found",
          });
        }

        return res.status(200).json({
          ok: true,
          message: "Contact unblocked successfully",
        });
      }

      case "GET": {
        // Get list of blocked contacts
        const blocks = await BlockedContact.find({ userId: user.sub })
          .populate("personId", "phones emails")
          .sort({ blockedAt: -1 })
          .lean();

        const blockedContacts = blocks.map((block: any) => ({
          id: block._id.toString(),
          personId: block.personId?._id?.toString() || null,
          phoneNumber: block.phoneNumber || block.personId?.phones?.[0]?.value || null,
          reason: block.reason,
          blockedAt: block.blockedAt,
          person: block.personId
            ? {
                phones: block.personId.phones || [],
                emails: block.personId.emails || [],
              }
            : null,
        }));

        return res.status(200).json(blockedContacts);
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err: any) {
    console.error("Block contact error:", err);
    return res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Failed to process block request",
    });
  }
}

export default withAuth(handler);


/*** Add File: safecontacts/pages/api/contacts/index.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../../lib/auth";
import mongoose from "mongoose";
import Contact from "../../../models/Contact";

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

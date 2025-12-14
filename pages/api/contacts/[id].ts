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
      for (const key of Object.keys(req.body)) {
        if (allowed.includes(key)) {
          (contact as any)[key] = req.body[key];
        }
      }
      await contact.save();
      return res.status(200).json(contact);
    }
    default:
      res.setHeader("Allow", ["GET", "PUT", "PATCH"]);
      return res.status(405).end();
  }
}

export default withAuth(handler);

/*** Add File: pages/api/trust/index.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../../lib/auth";
import mongoose from "mongoose";

import TrustEdge from "../../../models/TrustEdge";
import User from "../../../models/User";

/**
 * API route for managing trust relationships between people.
 *
 * GET /api/trust
 *   Returns a list of outgoing trust edges for the authenticated user.  Each
 *   entry includes the trust level and basic details about the trusted
 *   person (phones, emails, addresses, socials).  The caller must be
 *   authenticated and have a `personId` associated with their `User`
 *   document; otherwise a 404 is returned.
 *
 * POST /api/trust
 *   Creates or updates a trust edge from the authenticated user to
 *   another person.  The request body must include `toPersonId` and may
 *   optionally specify a `level`.  If an edge already exists, its
 *   `level` is updated.  Otherwise a new edge is created.  The
 *   response includes the edge id, trust level and basic details about
 *   the trusted person.  Only authenticated callers may perform this
 *   action.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const user: any = (req as any).user;

  // Require authentication
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: "UNAUTHORIZED" });
  }

  // Establish a DB connection if needed
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  switch (method) {
    case "GET": {
      try {
        // Find the caller's personId via the User document
        const caller = await User.findById(user.sub).lean() as { personId?: unknown } | null | undefined;
        if (!caller || !caller.personId) {
          return res.status(404).json({ ok: false, code: "NOT_FOUND", message: "Person not found for user" });
        }
        // Fetch trust edges originating from the caller
        const edges = await TrustEdge.find({ fromPersonId: caller.personId }).populate("toPersonId").lean();
        const result = edges.map((edge: any) => ({
          _id: edge._id.toString(),
          level: edge.level,
          to: {
            _id: edge.toPersonId._id.toString(),
            phones: edge.toPersonId.phones || [],
            emails: edge.toPersonId.emails || [],
            addresses: edge.toPersonId.addresses || [],
            socials: edge.toPersonId.socials || {},
          },
        }));
        return res.status(200).json(result);
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ ok: false, code: "INTERNAL_ERROR", message: "Failed to fetch trust edges" });
      }
    }
    case "POST": {
      const { toPersonId, level } = req.body || {};
      if (!toPersonId) {
        return res.status(400).json({ ok: false, code: "VALIDATION_ERROR", message: "toPersonId is required" });
      }
      try {
        const caller = await User.findById(user.sub).lean() as { personId?: unknown } | null | undefined;
        if (!caller || !caller.personId) {
          return res.status(404).json({ ok: false, code: "NOT_FOUND", message: "Person not found for user" });
        }
        const fromPersonId = caller.personId;
        // Either update existing edge or create a new one
        let edge = await TrustEdge.findOne({ fromPersonId, toPersonId });
        if (edge) {
          if (level !== undefined) {
            edge.level = level;
            await edge.save();
          }
        } else {
          edge = await TrustEdge.create({ fromPersonId, toPersonId, level: level ?? 1 });
        }
        // Populate the destination person to include contact details
        await edge.populate("toPersonId");
        const populated: any = edge.toObject({ virtuals: false });
        return res.status(201).json({
          _id: populated._id.toString(),
          level: populated.level,
          to: {
            _id: populated.toPersonId._id.toString(),
            phones: populated.toPersonId.phones || [],
            emails: populated.toPersonId.emails || [],
            addresses: populated.toPersonId.addresses || [],
            socials: populated.toPersonId.socials || {},
          },
        });
      } catch (err: any) {
        console.error(err);
        return res.status(500).json({ ok: false, code: "INTERNAL_ERROR", message: "Failed to create trust edge" });
      }
    }
    default: {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }
  }
}

export default withAuth(handler);


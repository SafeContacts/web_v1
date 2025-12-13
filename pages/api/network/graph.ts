/*** Add File: pages/api/network/graph.ts
   Returns a simple trust network graph for the authenticated user. Nodes
   represent users and edges represent confirmed trust relationships.
***/
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../../lib/auth";
import mongoose from "mongoose";

import User from "../../../models/User";
import ContactEdge from "../../../models/ContactEdge";
import TrustEdge from "../../../models/TrustEdge";
import Person from "../../../models/Person";

/**
 * Network graph API.  Returns a simple network for the authenticated user.
 *
 * GET /api/network/graph
 *   Responds with a small graph containing the caller's person node, any
 *   persons they have created contact edges to (from the `ContactEdge`
 *   collection) and any persons they trust (from the `TrustEdge`
 *   collection).  Nodes include minimal person details and a computed
 *   `type` ("self" or undefined) to differentiate the caller.  Edges
 *   include `source`, `target`, `relation` ("contact" or "trust") and
 *   `weight` or `level`.  This endpoint does not perform any complex
 *   graph expansion; it is intended as a starting point for visualisations.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: "UNAUTHORIZED" });
  }
  if (method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  try {
    // Ensure DB connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!, {});
    }
    // Find caller's personId
    const caller = await User.findById(user.sub).lean();
    if (!caller || !caller.personId) {
      return res.status(404).json({ ok: false, code: "NOT_FOUND", message: "Person not found for user" });
    }
    const personId = caller.personId.toString();
    // Fetch contact edges from caller
    const contactEdges = await ContactEdge.find({ fromPersonId: caller.personId }).lean();
    // Fetch trust edges from caller
    const trustEdges = await TrustEdge.find({ fromPersonId: caller.personId }).lean();
    // Collect unique node ids (including caller)
    const nodeIds = new Set<string>();
    nodeIds.add(personId);
    for (const e of contactEdges) nodeIds.add(e.toPersonId.toString());
    for (const e of trustEdges) nodeIds.add(e.toPersonId.toString());
    // Load persons
    const persons = await Person.find({ _id: { $in: Array.from(nodeIds) } }).lean();
    const personMap: Record<string, any> = {};
    persons.forEach((p) => {
      personMap[p._id.toString()] = p;
    });
    // Build nodes array with optional type
    const nodes = Array.from(nodeIds).map((id) => {
      const p = personMap[id];
      const isSelf = id === personId;
      return {
        id,
        type: isSelf ? "self" : undefined,
        label: (p?.emails?.[0]?.value || p?.phones?.[0]?.value || id),
        trustScore: (p as any)?.trustScore || 0,
      };
    });
    // Build edges array
    const edges: any[] = [];
    contactEdges.forEach((e) => {
      edges.push({
        source: e.fromPersonId.toString(),
        target: e.toPersonId.toString(),
        relation: "contact",
        weight: e.weight,
      });
    });
    trustEdges.forEach((e) => {
      edges.push({
        source: e.fromPersonId.toString(),
        target: e.toPersonId.toString(),
        relation: "trust",
        level: e.level,
      });
    });
    return res.status(200).json({ nodes, edges });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, code: "INTERNAL_ERROR", message: "Failed to build network graph" });
  }
}

export default withAuth(handler);


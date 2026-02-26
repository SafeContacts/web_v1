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
import Contact from "../../../models/Contact";
import ContactAlias from "../../../models/ContactAlias";

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
    
    // Check if user is admin and wants full network view
    const { fullNetwork } = req.query;
    const isAdmin = user.role === "admin";
    const showFullNetwork = isAdmin && fullNetwork === "true";
    
    // Find caller's personId
    const caller = await User.findById(user.sub).lean() as { personId?: unknown } | null | undefined;
    if (!caller || !caller.personId) {
      return res.status(404).json({ ok: false, code: "NOT_FOUND", message: "Person not found for user" });
    }
    const personId = caller.personId.toString();
    
    // If admin wants full network, return all nodes and edges
    if (showFullNetwork) {
      const allEdges = await ContactEdge.find({}).lean();
      const allTrustEdges = await TrustEdge.find({}).lean();
      
      // Get all unique person IDs
      const allPersonIds = new Set<string>();
      allEdges.forEach((e) => {
        allPersonIds.add(e.fromPersonId.toString());
        allPersonIds.add(e.toPersonId.toString());
      });
      allTrustEdges.forEach((e) => {
        allPersonIds.add(e.fromPersonId.toString());
        allPersonIds.add(e.toPersonId.toString());
      });
      
      // Get all persons
      const allPersons = await Person.find({ _id: { $in: Array.from(allPersonIds) } }).lean();
      const personMap: Record<string, any> = {};
      allPersons.forEach((p) => {
        personMap[p._id.toString()] = p;
      });
      
      // Get all users to identify registered nodes
      const allUsers = await User.find({}).lean();
      const userPersonMap: Record<string, any> = {};
      allUsers.forEach((u) => {
        if (u.personId) {
          userPersonMap[u.personId.toString()] = u;
        }
      });
      
      // Get all aliases
      const allAliases = await ContactAlias.find({}).lean();
      const aliasMap: Record<string, Record<string, string>> = {}; // userId -> personId -> alias
      allAliases.forEach((a) => {
        if (!aliasMap[a.userId]) aliasMap[a.userId] = {};
        aliasMap[a.userId][a.personId.toString()] = a.alias;
      });
      
      // Build nodes
      const nodes = Array.from(allPersonIds).map((id) => {
        const p = personMap[id];
        const isRegistered = !!userPersonMap[id];
        const user = userPersonMap[id];
        
        // Try to get alias from any user who has this person
        let label = p?.emails?.[0]?.value || p?.phones?.[0]?.value || id;
        for (const userId in aliasMap) {
          if (aliasMap[userId][id]) {
            label = aliasMap[userId][id];
            break;
          }
        }
        
        return {
          id,
          type: isRegistered ? "registered" : "contact",
          label,
          trustScore: p?.trustScore || 0,
          isRegistered,
          registeredUserId: user?._id?.toString() || null,
        };
      });
      
      // Build edges
      const edges: any[] = [];
      const edgeMap = new Map<string, any>();
      
      allEdges.forEach((e) => {
        const key = `${e.fromPersonId.toString()}-${e.toPersonId.toString()}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            source: e.fromPersonId.toString(),
            target: e.toPersonId.toString(),
            relation: "contact",
            weight: e.weight || 1,
          });
        }
      });
      
      edgeMap.forEach((edge) => edges.push(edge));
      
      allTrustEdges.forEach((e) => {
        edges.push({
          source: e.fromPersonId.toString(),
          target: e.toPersonId.toString(),
          relation: "trust",
          level: e.level,
          weight: 1,
        });
      });
      
      return res.status(200).json({ nodes, links: edges, edges, isFullNetwork: true });
    }
    
    // Fetch all contact edges (both directions to detect mutual connections)
    const outgoingContactEdges = await ContactEdge.find({ fromPersonId: caller.personId }).lean();
    const incomingContactEdges = await ContactEdge.find({ toPersonId: caller.personId }).lean();
    
    // Fetch trust edges from caller
    const trustEdges = await TrustEdge.find({ fromPersonId: caller.personId }).lean();
    
    // Also get contacts from Contact model and create edges if they don't exist
    const userContacts = await Contact.find({ userId: user.sub }).lean();
    const CallLog = mongoose.models.CallLog || (await import("../../../models/CallLog")).default;
    
    // Helper to normalize phone
    const toE164 = (phone: string): string => {
      const digits = phone.replace(/\D/g, '');
      if (digits.startsWith('1') && digits.length === 11) return '+' + digits;
      if (digits.length === 10) return '+1' + digits;
      return '+' + digits;
    };
    
    // For each contact, find or create Person and ensure ContactEdge exists
    for (const contact of userContacts) {
      const primaryPhone = contact.phones?.[0]?.value;
      if (primaryPhone) {
        const phoneE164 = toE164(primaryPhone);
        let person = await Person.findOne({
          $or: [
            { "phones.e164": phoneE164 },
            { "phones.value": primaryPhone },
          ],
        }).lean();
        
        if (person) {
          const toPersonId = person._id;
          // Ensure ContactEdge exists
          const existingEdge = await ContactEdge.findOne({
            fromPersonId: caller.personId,
            toPersonId: toPersonId,
          }).lean();
          
          if (!existingEdge) {
            // Calculate weight based on call logs and messages
            const callLogs = await CallLog.find({
              userId: user.sub,
              toPersonId: toPersonId,
            }).lean();
            
            const weight = Math.max(1, callLogs.length);
            await ContactEdge.create({
              fromPersonId: caller.personId,
              toPersonId: toPersonId,
              weight: weight,
              lastContactedAt: callLogs.length > 0 ? callLogs[0].timestamp : new Date(),
            });
          }
        }
      }
    }
    
    // Re-fetch edges after creating missing ones
    const updatedOutgoingEdges = await ContactEdge.find({ fromPersonId: caller.personId }).lean();
    const updatedIncomingEdges = await ContactEdge.find({ toPersonId: caller.personId }).lean();
    
    // Collect unique node ids (including caller)
    const nodeIds = new Set<string>();
    nodeIds.add(personId);
    
    // Add nodes from contact edges
    for (const e of updatedOutgoingEdges) nodeIds.add(e.toPersonId.toString());
    for (const e of updatedIncomingEdges) nodeIds.add(e.fromPersonId.toString());
    for (const e of trustEdges) nodeIds.add(e.toPersonId.toString());
    
    // Get ContactAlias to map contacts to persons and get names
    const aliases = await ContactAlias.find({ userId: user.sub }).lean();
    const aliasPersonMap: Record<string, string> = {};
    aliases.forEach((a) => {
      aliasPersonMap[a.personId.toString()] = a.alias;
    });
    
    // Also map Contact names to persons
    for (const contact of userContacts) {
      const primaryPhone = contact.phones?.[0]?.value;
      if (primaryPhone) {
        const phoneE164 = toE164(primaryPhone);
        const person = await Person.findOne({
          $or: [
            { "phones.e164": phoneE164 },
            { "phones.value": primaryPhone },
          ],
        }).lean();
        if (person) {
          const personIdStr = person._id.toString();
          if (!aliasPersonMap[personIdStr]) {
            aliasPersonMap[personIdStr] = contact.name;
          }
        }
      }
    }
    
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
      // Get label from alias if available, otherwise from person data
      const alias = aliasPersonMap[id];
      const label = alias || p?.emails?.[0]?.value || p?.phones?.[0]?.value || id;
      return {
        id,
        type: isSelf ? "self" : undefined,
        label,
        trustScore: (p as any)?.trustScore || 0,
        fx: isSelf ? 0 : undefined, // Center the user node
        fy: isSelf ? 0 : undefined,
      };
    });
    
    // Build edges array with mutual connection detection
    const edges: any[] = [];
    const edgeMap = new Map<string, any>();
    
    // Process outgoing contact edges (these are level 1 - direct connections)
    updatedOutgoingEdges.forEach((e) => {
      const key = `${e.fromPersonId.toString()}-${e.toPersonId.toString()}`;
      const person = personMap[e.toPersonId.toString()];
      const trustScore = person?.trustScore || 0;
      edgeMap.set(key, {
        source: e.fromPersonId.toString(),
        target: e.toPersonId.toString(),
        relation: "contact",
        weight: e.weight || 1,
        mutual: false,
        level: 1, // Direct connection
        trustScore: trustScore,
      });
    });
    
    // Process incoming contact edges and mark mutual connections
    updatedIncomingEdges.forEach((e) => {
      const key = `${e.toPersonId.toString()}-${e.fromPersonId.toString()}`;
      const reverseKey = `${e.fromPersonId.toString()}-${e.toPersonId.toString()}`;
      if (edgeMap.has(reverseKey)) {
        // Mutual connection exists
        const existing = edgeMap.get(reverseKey);
        existing.mutual = true;
        existing.weight = (existing.weight || 1) + (e.weight || 1);
      } else {
        // Only incoming edge
        const person = personMap[e.fromPersonId.toString()];
        const trustScore = person?.trustScore || 0;
        edgeMap.set(key, {
          source: e.fromPersonId.toString(),
          target: e.toPersonId.toString(),
          relation: "contact",
          weight: e.weight || 1,
          mutual: false,
          level: 1, // Direct connection
          trustScore: trustScore,
        });
      }
    });
    
    // Add all contact edges
    edgeMap.forEach((edge) => {
      edges.push(edge);
    });
    
    // Add trust edges
    trustEdges.forEach((e) => {
      edges.push({
        source: e.fromPersonId.toString(),
        target: e.toPersonId.toString(),
        relation: "trust",
        level: e.level,
        weight: 1,
      });
    });
    
    return res.status(200).json({ nodes, links: edges, edges });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, code: "INTERNAL_ERROR", message: "Failed to build network graph" });
  }
}

export default withAuth(handler);


// pages/api/network/search.ts
// Network search API - searches across first and second level connections
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../../lib/auth";
import mongoose from "mongoose";
import User from "../../../models/User";
import Person from "../../../models/Person";
import ContactEdge from "../../../models/ContactEdge";
import ContactAlias from "../../../models/ContactAlias";
import ConnectionRequest from "../../../models/ConnectionRequest";
import BlockedContact from "../../../models/BlockedContact";

// Admin configurable network depth (default: 2 for first and second level)
const NETWORK_DEPTH = parseInt(process.env.NETWORK_SEARCH_DEPTH || "2", 10);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: "UNAUTHORIZED" });
  }

  // Ensure database connection
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  try {
    const { query } = req.query;
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ ok: false, code: "VALIDATION_ERROR", message: "Query parameter is required" });
    }

    const searchTerm = query.toLowerCase().trim();
    const searchTermDigits = searchTerm.replace(/\D/g, "");

    // Get caller's personId
    const caller = await User.findById(user.sub).lean() as { personId?: unknown } | null | undefined;
    if (!caller || !caller.personId) {
      return res.status(404).json({ ok: false, code: "NOT_FOUND", message: "Person not found for user" });
    }
    const callerPersonId = caller.personId;

    // Get first level connections (direct contacts)
    const firstLevelEdges = await ContactEdge.find({ fromPersonId: callerPersonId }).lean();
    const firstLevelPersonIds = new Set<string>();
    firstLevelEdges.forEach((e) => firstLevelPersonIds.add(e.toPersonId.toString()));

    // Get second level connections (contacts of contacts)
    const secondLevelPersonIds = new Set<string>();
    if (NETWORK_DEPTH >= 2 && firstLevelPersonIds.size > 0) {
      const secondLevelEdges = await ContactEdge.find({
        fromPersonId: { $in: Array.from(firstLevelPersonIds).map((id) => new mongoose.Types.ObjectId(id)) },
      }).lean();
      secondLevelEdges.forEach((e) => {
        const toId = e.toPersonId.toString();
        // Exclude caller and first level connections
        if (toId !== callerPersonId.toString() && !firstLevelPersonIds.has(toId)) {
          secondLevelPersonIds.add(toId);
        }
      });
    }

    // Combine all searchable person IDs
    const searchablePersonIds = new Set([...firstLevelPersonIds, ...secondLevelPersonIds]);

    // Search persons by name (via aliases), phone, or email
    // First, find aliases matching the search term
    const matchingAliases = await ContactAlias.find({
      alias: { $regex: searchTerm, $options: "i" },
    }).lean();
    const aliasPersonIds = new Set(matchingAliases.map((a) => a.personId.toString()));

    // Build person query - search by phone, email, or alias match
    const personQuery: any = {
      $or: [
        { "phones.value": { $regex: searchTerm, $options: "i" } },
        { "phones.e164": { $regex: searchTermDigits, $options: "i" } },
        { "emails.value": { $regex: searchTerm, $options: "i" } },
        ...(aliasPersonIds.size > 0 ? [{ _id: { $in: Array.from(aliasPersonIds).map((id) => new mongoose.Types.ObjectId(id)) } }] : []),
      ],
    };

    // If we have network connections, limit search to those
    if (searchablePersonIds.size > 0) {
      // Also include persons matched by alias if they're in the network
      const allSearchableIds = new Set([...searchablePersonIds, ...aliasPersonIds]);
      personQuery._id = { $in: Array.from(allSearchableIds).map((id) => new mongoose.Types.ObjectId(id)) };
    } else {
      // If no network connections, still search by alias if available
      if (aliasPersonIds.size > 0) {
        personQuery._id = { $in: Array.from(aliasPersonIds).map((id) => new mongoose.Types.ObjectId(id)) };
      } else {
        // No network connections and no alias matches - return empty
        return res.status(200).json([]);
      }
    }

    const persons = await Person.find(personQuery).limit(50).lean();

    // Get aliases for all persons
    const personIds = persons.map((p) => p._id);
    
    // Filter out blocked contacts
    const blockedContacts = await BlockedContact.find({
      userId: user.sub,
      $or: [
        { personId: { $in: personIds } },
        { phoneNumber: { $in: persons.flatMap((p) => p.phones?.map((ph: any) => ph.value || ph.e164) || []) } },
      ],
    }).lean();
    
    const blockedPersonIds = new Set(
      blockedContacts
        .map((b) => b.personId?.toString())
        .filter((id) => id)
    );
    const blockedPhones = new Set(
      blockedContacts
        .map((b) => b.phoneNumber)
        .filter((phone) => phone)
    );
    
    // Filter out blocked persons
    const filteredPersons = persons.filter((p) => {
      const personIdStr = p._id.toString();
      if (blockedPersonIds.has(personIdStr)) return false;
      const personPhones = p.phones?.map((ph: any) => ph.value || ph.e164) || [];
      if (personPhones.some((phone) => blockedPhones.has(phone))) return false;
      return true;
    });
    const aliases = await ContactAlias.find({
      personId: { $in: personIds },
    }).lean();
    const aliasMap: Record<string, string> = {};
    aliases.forEach((a) => {
      const personIdStr = a.personId.toString();
      if (!aliasMap[personIdStr] || a.userId === user.sub) {
        aliasMap[personIdStr] = a.alias;
      }
    });

    // Get connection requests
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromPersonId: callerPersonId, toPersonId: { $in: personIds } },
        { fromPersonId: { $in: personIds }, toPersonId: callerPersonId },
      ],
    }).lean();
    const requestMap: Record<string, any> = {};
    connectionRequests.forEach((req) => {
      const key = `${req.fromPersonId.toString()}-${req.toPersonId.toString()}`;
      requestMap[key] = req;
    });

    // Build results with privacy controls
    const results = filteredPersons.map((person) => {
      const personIdStr = person._id.toString();
      const isFirstLevel = firstLevelPersonIds.has(personIdStr);
      const isSecondLevel = secondLevelPersonIds.has(personIdStr);
      const connectionLevel = isFirstLevel ? 1 : isSecondLevel ? 2 : 0;

      // Check for existing connection request
      const outgoingRequest = requestMap[`${callerPersonId.toString()}-${personIdStr}`];
      const incomingRequest = requestMap[`${personIdStr}-${callerPersonId.toString()}`];

      // Privacy: Only show phone numbers for first level connections
      const showPhone = isFirstLevel;
      const showEmail = isFirstLevel;

      const result: any = {
        _id: personIdStr,
        personId: personIdStr,
        name: aliasMap[personIdStr] || person.emails?.[0]?.value || person.phones?.[0]?.value || "Unknown",
        connectionLevel,
        isConnected: isFirstLevel,
        trustScore: person.trustScore || 0,
        phones: showPhone
          ? person.phones || []
          : person.phones?.map(() => ({ value: "***", label: "hidden" })) || [],
        emails: showEmail
          ? person.emails || []
          : person.emails?.map(() => ({ value: "***", label: "hidden" })) || [],
        addresses: isFirstLevel ? person.addresses || [] : [],
        socials: isFirstLevel ? person.socials || {} : {},
        connectionRequest: outgoingRequest
          ? { status: outgoingRequest.status, id: outgoingRequest._id.toString() }
          : incomingRequest
          ? { status: incomingRequest.status, id: incomingRequest._id.toString(), incoming: true }
          : null,
      };

      return result;
    });

    // Sort by connection level (first level first), then by name
    results.sort((a, b) => {
      if (a.connectionLevel !== b.connectionLevel) {
        return a.connectionLevel - b.connectionLevel;
      }
      return a.name.localeCompare(b.name);
    });

    return res.status(200).json(results);
  } catch (err: any) {
    console.error("Network search error:", err);
    return res.status(500).json({ ok: false, code: "INTERNAL_ERROR", message: "Failed to search network" });
  }
}

export default withAuth(handler);


// lib/networkPath.ts
// Helper functions to find connection paths between persons in the network

import mongoose from "mongoose";
import ContactEdge from "../models/ContactEdge";
import ContactAlias from "../models/ContactAlias";
import Person from "../models/Person";

/**
 * Find the shortest connection path between two persons in the network.
 * Returns the path as an array of person IDs, or null if no path exists.
 * Maximum depth is 2 (1st and 2nd level connections).
 */
export async function findConnectionPath(
  fromPersonId: mongoose.Types.ObjectId,
  toPersonId: mongoose.Types.ObjectId,
  maxDepth: number = 2
): Promise<{ path: string[]; level: number; viaPersonId?: string } | null> {
  // Direct connection (1st level)
  const directEdge = await ContactEdge.findOne({
    fromPersonId: fromPersonId,
    toPersonId: toPersonId,
  }).lean();

  if (directEdge) {
    return { path: [fromPersonId.toString(), toPersonId.toString()], level: 1 };
  }

  // Check reverse direction (mutual connection)
  const reverseEdge = await ContactEdge.findOne({
    fromPersonId: toPersonId,
    toPersonId: fromPersonId,
  }).lean();

  if (reverseEdge) {
    return { path: [fromPersonId.toString(), toPersonId.toString()], level: 1 };
  }

  // If maxDepth is 1, stop here
  if (maxDepth < 2) {
    return null;
  }

  // Find 2nd level connection (via a mutual contact)
  // Get all 1st level connections from fromPersonId
  const firstLevelEdges = await ContactEdge.find({
    fromPersonId: fromPersonId,
  }).lean();

  const firstLevelPersonIds = firstLevelEdges.map((e) => e.toPersonId.toString());

  // Check if any 1st level connection has an edge to toPersonId
  for (const firstLevelPersonId of firstLevelPersonIds) {
    const secondLevelEdge = await ContactEdge.findOne({
      fromPersonId: new mongoose.Types.ObjectId(firstLevelPersonId),
      toPersonId: toPersonId,
    }).lean();

    if (secondLevelEdge) {
      return {
        path: [fromPersonId.toString(), firstLevelPersonId, toPersonId.toString()],
        level: 2,
        viaPersonId: firstLevelPersonId,
      };
    }

    // Also check reverse direction
    const reverseSecondLevelEdge = await ContactEdge.findOne({
      fromPersonId: toPersonId,
      toPersonId: new mongoose.Types.ObjectId(firstLevelPersonId),
    }).lean();

    if (reverseSecondLevelEdge) {
      return {
        path: [fromPersonId.toString(), firstLevelPersonId, toPersonId.toString()],
        level: 2,
        viaPersonId: firstLevelPersonId,
      };
    }
  }

  return null;
}

/**
 * Get connection path details with person names/aliases for display
 */
export async function getConnectionPathDetails(
  fromPersonId: mongoose.Types.ObjectId,
  toPersonId: mongoose.Types.ObjectId,
  userId: string,
  maxDepth: number = 2
): Promise<{
  level: number;
  path: Array<{ personId: string; name: string }>;
  viaPersonName?: string;
} | null> {
  const pathResult = await findConnectionPath(fromPersonId, toPersonId, maxDepth);
  if (!pathResult) {
    return null;
  }

  // Get aliases for all persons in the path
  const personIds = pathResult.path.map((id) => new mongoose.Types.ObjectId(id));
  const aliases = await ContactAlias.find({
    userId: userId,
    personId: { $in: personIds },
  }).lean();

  const aliasMap: Record<string, string> = {};
  aliases.forEach((a) => {
    aliasMap[a.personId.toString()] = a.alias;
  });

  // Get person details
  const persons = await Person.find({ _id: { $in: personIds } }).lean();
  const personMap: Record<string, any> = {};
  persons.forEach((p) => {
    personMap[p._id.toString()] = p;
  });

  // Build path with names
  const pathWithNames = pathResult.path.map((personIdStr) => {
    const person = personMap[personIdStr];
    const alias = aliasMap[personIdStr];
    const name =
      alias ||
      person?.emails?.[0]?.value ||
      person?.phones?.[0]?.value ||
      "Unknown";
    return { personId: personIdStr, name };
  });

  // Get via person name if it's a 2nd level connection
  let viaPersonName: string | undefined;
  if (pathResult.viaPersonId) {
    const viaPerson = personMap[pathResult.viaPersonId];
    const viaAlias = aliasMap[pathResult.viaPersonId];
    viaPersonName =
      viaAlias ||
      viaPerson?.emails?.[0]?.value ||
      viaPerson?.phones?.[0]?.value ||
      "Unknown";
  }

  return {
    level: pathResult.level,
    path: pathWithNames,
    viaPersonName,
  };
}


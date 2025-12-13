import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "../../../../lib/auth";
import mongoose from "mongoose";
import Person from "../../../../models/Person";
import User from "../../../../models/User";
import ContactAlias from "../../../../models/ContactAlias";
import ContactEdge from "../../../../models/ContactEdge";
import TrustEdge from "../../../../models/TrustEdge";
import CallLog from "../../../../models/CallLog";

/**
 * Admin metrics endpoint.  Returns counts of the core collections as well
 * as aggregated platform metrics with trending percentages.  Only
 * accessible to users with the `admin` role.  The response includes
 * both raw counts (persons, users, aliases, contactEdges, trustEdges,
 * callLogs) and high-level metrics with trending deltas.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: "UNAUTHORIZED" });
  }
  if (user.role !== "admin") {
    return res.status(403).json({ ok: false, code: "FORBIDDEN", message: "Admin access required" });
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }
  try {
    // Count total documents for core collections
    const [pCount, uCount, aCount, ceCount, teCount, clCount] = await Promise.all([
      Person.countDocuments(),
      User.countDocuments(),
      ContactAlias.countDocuments(),
      ContactEdge.countDocuments(),
      TrustEdge.countDocuments(),
      CallLog.countDocuments(),
    ]);
    const now = new Date();
    const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    // Percentage change helper
    function pctChange(curr: number, prev: number): number {
      if (prev === 0) return 0;
      return ((curr - prev) / prev) * 100;
    }
    // Daily active users: distinct userIds in CallLog
    const [dauCurrDocs, dauPrevDocs] = await Promise.all([
      CallLog.find({ timestamp: { $gte: lastWeekStart } }, { userId: 1 }).lean(),
      CallLog.find({ timestamp: { $gte: prevWeekStart, $lt: lastWeekStart } }, { userId: 1 }).lean(),
    ]);
    const dauCurr = new Set(dauCurrDocs.map((d: any) => d.userId)).size;
    const dauPrev = new Set(dauPrevDocs.map((d: any) => d.userId)).size;
    const dauTrending = pctChange(dauCurr, dauPrev);
    // Total syncs: number of aliases created in last week vs previous week
    const [syncCurr, syncPrev] = await Promise.all([
      ContactAlias.countDocuments({ createdAt: { $gte: lastWeekStart } }),
      ContactAlias.countDocuments({ createdAt: { $gte: prevWeekStart, $lt: lastWeekStart } }),
    ]);
    const syncTrending = pctChange(syncCurr, syncPrev);
    // Network updates: number of TrustEdges created in last week vs previous week
    const [updatesCurr, updatesPrev] = await Promise.all([
      TrustEdge.countDocuments({ createdAt: { $gte: lastWeekStart } }),
      TrustEdge.countDocuments({ createdAt: { $gte: prevWeekStart, $lt: lastWeekStart } }),
    ]);
    const updatesTrending = pctChange(updatesCurr, updatesPrev);
    // Conflicts resolved: number of CallLogs created in last week vs previous week
    const [conflictsCurr, conflictsPrev] = await Promise.all([
      CallLog.countDocuments({ timestamp: { $gte: lastWeekStart } }),
      CallLog.countDocuments({ timestamp: { $gte: prevWeekStart, $lt: lastWeekStart } }),
    ]);
    const conflictsTrending = pctChange(conflictsCurr, conflictsPrev);
    // Business claims: number of persons with at least one social handle created last week vs previous week
    const [claimsCurr, claimsPrev] = await Promise.all([
      Person.countDocuments({
        createdAt: { $gte: lastWeekStart },
        $or: [
          { "socials.linkedIn": { $exists: true, $ne: null } },
          { "socials.twitter": { $exists: true, $ne: null } },
          { "socials.instagram": { $exists: true, $ne: null } },
        ],
      }),
      Person.countDocuments({
        createdAt: { $gte: prevWeekStart, $lt: lastWeekStart },
        $or: [
          { "socials.linkedIn": { $exists: true, $ne: null } },
          { "socials.twitter": { $exists: true, $ne: null } },
          { "socials.instagram": { $exists: true, $ne: null } },
        ],
      }),
    ]);
    const claimsTrending = pctChange(claimsCurr, claimsPrev);
    // Total users trending: number of new users created last week vs previous week
    const [usersCurr, usersPrev] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: lastWeekStart } }),
      User.countDocuments({ createdAt: { $gte: prevWeekStart, $lt: lastWeekStart } }),
    ]);
    const usersTrending = pctChange(usersCurr, usersPrev);
    // Respond with full metrics
    return res.status(200).json({
      persons: pCount,
      users: uCount,
      aliases: aCount,
      contactEdges: ceCount,
      trustEdges: teCount,
      callLogs: clCount,
      dailyActiveUsers: { count: dauCurr, trending: dauTrending },
      totalSyncs: { count: aCount, trending: syncTrending },
      networkUpdates: { count: teCount, trending: updatesTrending },
      totalUsers: { count: uCount, trending: usersTrending },
      conflictsResolved: { count: conflictsCurr, trending: conflictsTrending },
      businessClaims: { count: claimsCurr, trending: claimsTrending },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, code: "INTERNAL_ERROR", message: "Failed to compute metrics" });
  }
}

export default withAuth(handler);


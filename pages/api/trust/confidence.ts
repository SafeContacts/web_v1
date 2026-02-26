/* 
 *
 * import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }             from '../../../lib/mongodb';
import TrustEdge               from '../../../models/TrustEdge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { userId } = req.query as { userId: string };
  if (!userId) return res.status(400).json({ error: 'userId required' });

  // For MVP: score = min(mutuals * 20, 100)
  const mutuals = await TrustEdge.countDocuments({
    confirmed: true,
    $or: [
      { fromUser: userId },
      { toUser: userId }
    ]
  });
  const score = Math.min(mutuals * 20, 100);
  res.status(200).json({ confidenceScore: score });
}

*/

// File :: pages/api/trust/confidence.ts
import TrustEdge from '../../../models/TrustEdge';
import CallLog from '../../../models/CallLog';
import Contact from '../../../models/Contact';
import { spamNumbers } from './spamList';

/**
 * Calculate a composite confidence score (0–100) for a contact based on
 * mutual confirmations, call frequency, and other factors. This is a naive
 * implementation; in a real production system you might incorporate more
 * sophisticated heuristics and additional signals.
 */
export async function computeConfidenceScore(contactUserId: string, userId: string) {
  // Fetch mutual trust edges
  const mutualCount = await TrustEdge.countDocuments({ fromUserId: userId, toUserId: contactUserId, confirmed: true }) +
    await TrustEdge.countDocuments({ fromUserId: contactUserId, toUserId: userId, confirmed: true });
  // Fetch call logs in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const calls = await CallLog.countDocuments({ userId, contactId: contactUserId, timestamp: { $gte: thirtyDaysAgo } });

  // Weight these factors: 50% mutual trust, 30% calls, 20% placeholder for messages
  const trustScore = Math.min(mutualCount * 10, 50); // each mutual adds 10 points up to 50
  const callScore = Math.min(calls * 5, 30); // each call adds 5 points up to 30
  const messageScore = 0; // TODO: integrate message logs when available
  const total = trustScore + callScore + messageScore;
  return Math.min(100, total);
}

/**
 * A more robust confidence score calculation that incorporates call duration,
 * call frequency, second-degree mutual connections, and spam number penalties.
 * - Mutual trust edges add up to 40 points (10 points per mutual, capped at 4).
 * - Call frequency in the last 30 days adds 3 points per call, up to 20 points.
 * - Average call duration (in seconds) adds up to 10 points, where 60 seconds = 1 point.
 * - Each second-degree mutual friend adds 5 points, up to 20 points.
 * - If the contact's primary phone number is on a spam list, 30 points are deducted.
 *
 * The final score is clamped between 0 and 100.
 */
export async function computeAdvancedConfidenceScore(contactUserId: string, userId: string): Promise<number> {
  // Determine spam penalty by looking up the contact's primary phone number.
  let spamPenalty = 0;
  try {
    const contact = await Contact.findOne({ userId: contactUserId }).lean() as { phones?: { value?: string }[] } | null | undefined;
    const primaryPhone = contact?.phones?.[0]?.value?.replace(/\D/g, '');
    if (primaryPhone && spamNumbers.has(primaryPhone)) {
      spamPenalty = -30;
    }
  } catch (err) {
    console.error('Failed to compute spam penalty', err);
  }

  // Mutual trust edges (direct).
  const mutualCount =
    (await TrustEdge.countDocuments({ fromUserId: userId, toUserId: contactUserId, confirmed: true })) +
    (await TrustEdge.countDocuments({ fromUserId: contactUserId, toUserId: userId, confirmed: true }));
  const trustScore = Math.min(mutualCount * 10, 40);

  // Call logs within the last 30 days for this user-contact pair.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const callLogs = await CallLog.find({ userId, contactId: contactUserId, timestamp: { $gte: thirtyDaysAgo } });
  const callCount = callLogs.length;
  const totalDuration = callLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
  const avgDuration = callCount > 0 ? totalDuration / callCount : 0;
  const callScore = Math.min(callCount * 3, 20);
  const durationScore = Math.min(avgDuration / 60, 10);

  // Second-degree mutual connections: count shared trust targets.
  const userOutgoing = await TrustEdge.find({ fromUserId: userId, confirmed: true }).lean();
  const contactOutgoing = await TrustEdge.find({ fromUserId: contactUserId, confirmed: true }).lean();
  const userTrustSet = new Set<string>(userOutgoing.map((e) => e.toUserId));
  let mutualFriends = 0;
  contactOutgoing.forEach((e) => {
    if (userTrustSet.has(e.toUserId)) {
      mutualFriends += 1;
    }
  });
  const mutualFriendScore = Math.min(mutualFriends * 5, 20);

  let total = trustScore + callScore + durationScore + mutualFriendScore + spamPenalty;
  if (total < 0) total = 0;
  if (total > 100) total = 100;
  return total;
}

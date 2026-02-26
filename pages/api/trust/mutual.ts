import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }             from '../../../lib/mongodb';
import TrustEdge               from '../../../models/TrustEdge';
import Contact from '../../../models/Contact';
import { computeConfidenceScore } from '../../../lib/confidenceScore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  if (req.method === 'GET') {
  const { userA, userB } = req.query as { userA: string, userB: string };
  if (!userA || !userB) return res.status(400).json({ error: 'userA & userB required' });

  // count both directions confirmed
  const count = await TrustEdge.countDocuments({
    confirmed: true,
    $or: [
      { fromUser: userA, toUser: userB },
      { fromUser: userB, toUser: userA }
    ]
  });
  res.status(200).json({ mutualCount: count });
	}

  if (req.method === 'POST') {
    const { fromUserId, toUserId, confirm } = (req.body || {}) as { fromUserId?: string; toUserId?: string; confirm?: boolean };
    if (!fromUserId || !toUserId) return res.status(400).json({ error: 'fromUserId & toUserId required' });
		let edge = await TrustEdge.findOne({ fromPersonId: fromUserId, toPersonId: toUserId });
      if (edge) {
        if (confirm !== undefined) {
          (edge as any).confirmed = !!confirm;
          await edge.save();
        }
      } else {
        edge = await TrustEdge.create({ fromPersonId: fromUserId, toPersonId: toUserId, level: 1 });
      }
      // After creating or updating a trust edge, recompute trust scores for both parties.
      try {
        // For the recipient's contact (toUserId), compute score relative to fromUserId
        const newScoreTo = await computeConfidenceScore(toUserId as string, fromUserId as string);
        const contactTo = await Contact.findOne({ userId: toUserId });
        if (contactTo && newScoreTo !== null) {
          await Contact.findByIdAndUpdate(contactTo._id, { trustScore: newScoreTo });
        }
        // For the sender's contact (fromUserId), compute score relative to toUserId
        const newScoreFrom = await computeConfidenceScore(fromUserId as string, toUserId as string);
        const contactFrom = await Contact.findOne({ userId: fromUserId });
        if (contactFrom && newScoreFrom !== null) {
          await Contact.findByIdAndUpdate(contactFrom._id, { trustScore: newScoreFrom });
        }
      } catch (err) {
        console.error('Failed to update trust scores after trust edge change', err);
      }
      return res.status(200).json(edge);
  }
  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}


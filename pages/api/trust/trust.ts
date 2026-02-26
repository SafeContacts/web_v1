import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import TrustEdge from '../../../models/TrustEdge';
import Contact from '../../../models/Contact';
import { computeAdvancedConfidenceScore } from '../../../lib/confidenceScore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { method } = req;
  switch (method) {
    case 'GET': {
      const { userId } = req.query;
      const query: any = {};
      if (userId) {
        query.fromUserId = userId;
      }
      const edges = await TrustEdge.find(query).lean();
      return res.status(200).json(edges);
    }
    case 'POST': {
      const { fromUserId, toUserId, confirm } = req.body;
      if (!fromUserId || !toUserId) {
        return res.status(400).json({ error: 'fromUserId and toUserId are required' });
      }
      let edge = await TrustEdge.findOne({ fromUserId, toUserId });
      if (edge) {
        // If confirm is provided, update confirmed status
        if (confirm !== undefined) {
          edge.confirmed = !!confirm;
          await edge.save();
        }
      } else {
        edge = await TrustEdge.create({ fromUserId, toUserId, confirmed: !!confirm });
      }
      // After creating or updating a trust edge, recompute trust scores for both parties.
      try {
        // For the recipient's contact (toUserId), compute score relative to fromUserId
        const newScoreTo = await computeAdvancedConfidenceScore(toUserId as string, fromUserId as string);
        const contactTo = await Contact.findOne({ userId: toUserId });
        if (contactTo && newScoreTo !== null) {
          await Contact.findByIdAndUpdate(contactTo._id, { trustScore: newScoreTo });
        }
        // For the sender's contact (fromUserId), compute score relative to toUserId
        const newScoreFrom = await computeAdvancedConfidenceScore(fromUserId as string, toUserId as string);
        const contactFrom = await Contact.findOne({ userId: fromUserId });
        if (contactFrom && newScoreFrom !== null) {
          await Contact.findByIdAndUpdate(contactFrom._id, { trustScore: newScoreFrom });
        }
      } catch (err) {
        console.error('Failed to update trust scores after trust edge change', err);
      }
      return res.status(200).json(edge);
    }
    default:
      return res.setHeader('Allow', ['GET', 'POST']).status(405).end(`Method ${method} Not Allowed`);
  }
}

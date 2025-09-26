import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { computeAdvancedConfidenceScore } from '../../../lib/confidenceScore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();
  const { contactUserId, userId } = req.query;
  if (!contactUserId || Array.isArray(contactUserId) || !userId || Array.isArray(userId)) {
    return res.status(400).json({ error: 'contactUserId and userId are required' });
  }
  const score = await computeAdvancedConfidenceScore(contactUserId as string, userId as string);
  return res.status(200).json({ score });
}

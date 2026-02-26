//*** File: safecontacts/pages/api/trust/pagerank.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import { computePageRank } from '../../../lib/trustAlgorithms';

/**
 * API endpoint that computes global trust PageRank scores for all users.
 * Returns an object mapping userId to PageRank score. Scores sum to 1.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { damping, maxIter, tolerance } = req.query;
  const d = damping ? parseFloat(damping as string) : undefined;
  const maxI = maxIter ? parseInt(maxIter as string, 10) : undefined;
  const tol = tolerance ? parseFloat(tolerance as string) : undefined;
  try {
    const scores = await computePageRank(d, maxI, tol);
    return res.status(200).json({ scores });
  } catch (err) {
    console.error('Failed to compute PageRank', err);
    return res.status(500).json({ error: 'Failed to compute PageRank' });
  }
}

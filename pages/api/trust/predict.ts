//*** Add File: safecontacts/pages/api/trust/predict.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import { predictMissingTrustEdges } from '../../../lib/trustAlgorithms';

// API endpoint that uses matrix factorization to infer potential trust edges.
// Optional query params:
//   k: number of latent factors (default 2)
//   steps: number of training iterations (default 50)
//   top: number of predictions to return (default 20)
//   lr: learning rate for training (default 0.01)
//   lambda: regularization parameter (default 0.02)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { k, steps, top, lr, lambda } = req.query;
  const latentFactors = k ? parseInt(k as string, 10) : undefined;
  const iterations = steps ? parseInt(steps as string, 10) : undefined;
  const topN = top ? parseInt(top as string, 10) : 20;
  const learningRate = lr ? parseFloat(lr as string) : undefined;
  const reg = lambda ? parseFloat(lambda as string) : undefined;
  try {
    const predictions = await predictMissingTrustEdges(latentFactors, iterations, learningRate, reg);
    return res.status(200).json({ predictions: predictions.slice(0, topN) });
  } catch (err) {
    console.error('Failed to predict trust edges', err);
    return res.status(500).json({ error: 'Failed to predict trust edges' });
  }
}

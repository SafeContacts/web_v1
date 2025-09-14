import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }             from '../../../lib/mongodb';
import TrustEdge               from '../../../models/TrustEdge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  if (req.method !== 'POST') {
    res.setHeader('Allow',['POST']);
    return res.status(405).end();
  }
  const { edgeId } = req.body;
  const updated = await TrustEdge.findByIdAndUpdate(edgeId, { confirmed: true }, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: 'Trust edge not found' });
  res.status(200).json(updated);
}


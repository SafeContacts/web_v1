// pages/api/business/[id]/claim.ts
import type { NextApiRequest, NextApiResponse } from 'next';
export default function handler(_: NextApiRequest, res: NextApiResponse) {
  // stub: record claim request
  res.status(202).json({ message: 'Claim received' });
}


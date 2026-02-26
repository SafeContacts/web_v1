import type { NextApiRequest, NextApiResponse } from 'next';
import BusinessProfile from '../../../models/BusinessProfile';
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const q = (req.query.q as string) || '';
  const list = await BusinessProfile.find({ name: new RegExp(q,'i'), verified:true }).lean();
  res.json(list);
};


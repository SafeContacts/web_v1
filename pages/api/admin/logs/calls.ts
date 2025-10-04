import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }             from '../../../../lib/mongodb';
import { CallLog }             from '../../../../models/CallLog';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  await connect();
  const logs = await CallLog.find().sort({ timestamp: -1 }).limit(100).lean();
  res.status(200).json(logs);
}

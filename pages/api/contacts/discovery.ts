import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
//import User from '../../../models/User';
import { Contact } from '../../../models/Contact';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const q = Array.isArray(req.query.query)
	  ? req.query.query[0]
	  : (req.query.query as string) || '';

  //const { query } = req.query;
  const contacts = await Contact.find({
   // publicProfile: true,
    $or: [
      { phone: { $regex: q, $options: 'i' } },
      { name:  { $regex: q, $options: 'i' } }
    ]
  }).limit(20).lean();
  res.status(200).json(contacts);
}

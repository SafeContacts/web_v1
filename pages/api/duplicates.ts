// pages/api/duplicates.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../lib/mongodb';
import Contact from '../../models/Contact';
import { requireAuth } from '../../../src/middleware/requireAuth';


type DuplicateGroups = string[][];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DuplicateGroups>
) {
  await connect();
  const contacts = await Contact.find().lean();

  // Group by normalized phone (digits only)
  const map: Record<string, string[]> = {};
  contacts.forEach((c) => {
    const key = c.phone.replace(/\D/g, '');
    map[key] = map[key] || [];
    //map[key].push(c._id.toString());
    map[key].push(c.name.toString());
    map[key].push(c.phone.toString());
    map[key].push(c.email.toString());
  });

  // Only keep groups with more than 1 entry
  const groups = Object.values(map).filter((ids) => ids.length > 1);
  res.status(200).json(groups);
}

//export default requireAuth(handler, ['user','admin']);

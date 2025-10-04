
/*** Add File: pages/api/duplicates/merge.ts 
    API route to merge duplicate contacts. Expects a POST body with a
   `group` array of contact IDs. Returns the merged contact ID on success.
***/

import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import { requireAuth } from '../../../src/middleware/requireAuth';
import { mergeDuplicateGroup } from '../../../lib/duplicate';

export default requireAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connect();
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { group } = req.body as { group: string[] };
  if (!Array.isArray(group) || group.length < 2) {
    return res.status(400).json({ error: 'Provide an array of ≥2 contact IDs' });
  }
  const merged = await mergeDuplicateGroup(group);
  if (!merged) {
    return res.status(404).json({ error: 'Not enough contacts found to merge' });
  }
  return res.status(200).json({ mergedId: merged._id });
}, ['user', 'admin']);

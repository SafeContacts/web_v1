/*** File: pages/api/duplicates/index.ts */
// pages/api/duplicates/index.ts
// API route to fetch duplicate contact groups. Each group is an array of
// contact IDs that share a phone number or email address.

import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import { requireAuth } from '../../../src/middleware/requireAuth';
import { findDuplicateGroups } from '../../../lib/duplicate';

export default requireAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string[][]>
) {
  await connect();
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  // We ignore userId here because duplicates are global across all contacts
  const groups = await findDuplicateGroups();
  // Map to list of arrays of IDs for the response
  return res.status(200).json(groups.map((g) => g.contacts));
}, ['user', 'admin']);

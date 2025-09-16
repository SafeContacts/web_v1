// pages/api/network.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }             from '../../lib/mongodb';
import TrustEdge               from '../../models/TrustEdge';
import Contact                 from '../../models/Contact';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { userId } = req.query as { userId: string };

  // 1) Gather confirmed edges
  const edges = await TrustEdge.find({
    confirmed: true,
    $or: [ { fromUser: userId }, { toUser: userId } ]
  }).lean();

  // 2) Build set of involved contact IDs
  const ids = new Set<string>();
  ids.add(userId);
  edges.forEach(e => {
    ids.add(e.fromUser.toString());
    ids.add(e.toUser.toString());
  });

  // 3) Fetch Contact docs (alive + metadata)
  const contacts = await Contact.find({ _id: { $in: Array.from(ids) } }).lean();

  const nodes = contacts.map(c => ({
    id:            c._id.toString(),
    name:          c.name,
    isRegistered:  c.isRegistered,
    tags:          c.tags,
    confidence:    c.confidenceScore
  }));

  const links = edges.map(e => ({
    source: e.fromUser.toString(),
    target: e.toUser.toString()
  }));

  res.status(200).json({ nodes, links });
}


import type { NextApiRequest, NextApiResponse } from 'next';
import { connect }             from '../../lib/mongodb';
import TrustEdge               from '../../models/TrustEdge';
import User                    from '../../models/User';

type Node = { id: string; name: string };
type Link = { source: string; target: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { userId } = req.query as { userId: string };
  if (!userId) return res.status(400).json({ error: 'userId required' });

  // find confirmed edges involving this user
  const edges = await TrustEdge.find({
    confirmed: true,
    $or: [
      { fromUser: userId },
      { toUser:   userId }
    ]
  }).lean();

  // build nodes set
  const ids = new Set<string>();
  ids.add(userId);
  edges.forEach(e => {
    ids.add(e.fromUser);
    ids.add(e.toUser);
  });

  // fetch user names
  const users = await User.find({ _id: { $in: Array.from(ids) } }).lean();
  const nodes: Node[] = users.map(u => ({ id: u._id.toString(), name: u.name }));

  // build links
  const links: Link[] = edges.map(e => ({
    source: e.fromUser.toString(),
    target: e.toUser.toString()
  }));

  res.status(200).json({ nodes, links });
}

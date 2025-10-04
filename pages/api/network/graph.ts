/*** Add File: pages/api/network/graph.ts
   pages/api/network/graph.ts
   Returns a simple trust network graph for the authenticated user. Nodes
   represent users and edges represent confirmed trust relationships.
***/
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import TrustEdge from '../../../models/TrustEdge';
import { requireAuth } from '../../../src/middleware/requireAuth';

export default requireAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connect();
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  // Determine the user for whom to build the graph
  const queryUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
  const authUserId = (req as any).user?.sub;
  const userId = queryUserId || authUserId;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  // Fetch confirmed trust edges where the user participates as either sender or recipient
  const edgesRaw: any[] = await TrustEdge.find({
    confirmed: true,
    $or: [ { fromUser: userId }, { toUser: userId } ],
  }).lean();
  const nodeSet: Set<string> = new Set();
  edgesRaw.forEach((e) => {
    nodeSet.add(e.fromUser);
    nodeSet.add(e.toUser);
  });
  const nodes = Array.from(nodeSet).map((id) => ({ id, label: id }));
  const edges = edgesRaw.map((e) => ({
    source: e.fromUser,
    target: e.toUser,
    type: 'trust',
    weight: 1,
  }));
  return res.status(200).json({ nodes, edges });
}, ['user', 'admin']);


import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { connect } from '../../../lib/mongodb';
import Contact from '../../../models/Contact';
import { withAuth } from '../../../lib/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  // Ensure database connection
  if (mongoose.connection.readyState === 0) {
    await connect();
  }

  const user: any = (req as any).user;
  const userId = user?.sub;

  const q = Array.isArray(req.query.query) ? req.query.query[0] : (req.query.query as string) || '';

  if (!q.trim()) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Search contacts - can be enhanced to search across network
    const contacts = await Contact.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { 'person.phones.value': { $regex: q, $options: 'i' } },
        { 'person.emails.value': { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
      ],
    })
      .limit(20)
      .lean();

    res.status(200).json(contacts);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to search contacts' });
  }
}

export default withAuth(handler);

// pages/api/calls/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../lib/mongodb';
import { CallLog }    from '../../../models/CallLog';
import { Contact } from '../../../models/Contact';
import { computeConfidenceScore } from '../../../lib/confidenceScore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();

  if (req.method === 'POST') {
    const { contactId, phone, outgoing } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'phone is required' });
      return;
    }
   //const log = await CallLog.create({ contactId, phone, outgoing });
    const log = await CallLog.create({ userId, contactId, phoneNumber, type, timestamp: new Date() });
    // Recompute the trust score for the contact if a contactId is provided.
    // The trust score is stored on the contact document for quick access.
    if (contactId) {
	    try {
		    const newScore = await computeConfidenceScore(contactId as string, userId);
		    await Contact.findByIdAndUpdate(contactId, { trustScore: newScore });
	    } catch (err) {
		    console.error('Failed to update trust score after call log', err);
	    }
    }
      return res.status(201).json(log);
  }

  if (req.method === 'GET') {
    // Optionally filter by contactId: ?contactId=...
    const filter: any = {};
    if (req.query.contactId) filter.contactId = req.query.contactId;
    const logs = await CallLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    res.status(200).json(logs);
    return;
  }

  res.setHeader('Allow', ['GET','POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}


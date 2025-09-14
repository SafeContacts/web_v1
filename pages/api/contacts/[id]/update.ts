// pages/api/contacts/[id]/update.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../../../lib/mongodb';
import UpdateEvent from '../../../../models/UpdateEvent';
import Contact     from '../../../../models/Contact';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connect();
  const { id } = req.query as { id: string };

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const { field, oldValue, newValue, stealth = true } = req.body;
  if (!field || oldValue == null || newValue == null) {
    res.status(400).json({ error: 'field, oldValue, newValue are required' });
    return;
  }

  // 1) Persist the update event
  const evt = await UpdateEvent.create({ contactId: id, field, oldValue, newValue, stealth });

  // 2) Optionally apply immediately or wait for approval
  // Here we’ll just record; UI will call PATCH /contacts/[id] to apply

  res.status(201).json(evt);
}


// pages/api/contacts/[id].ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { connect }             from '../../../lib/mongodb'
import Contact                 from '../../../models/Contact'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connect()
    const { id } = req.query as { id: string }

    if (req.method === 'GET') {
      const c = await Contact.findById(id).lean()
      if (!c) {
        //res.status(404).end()
	res.status(404).json({ error: 'Contact not found', id : id});
        return
      }
      res.status(200).json(c)
      return
    }

    if (req.method === 'PATCH') {
      const updates = req.body
      //const temp_id = '68c2d1ccec0a4e7c223ddae9'
      const c = await Contact.findByIdAndUpdate(id, updates, { new: true }).lean()
      
      const filter = { contactId: id };

      // The result of `findOneAndUpdate()` is the document _before_ `update` was applied
      //const c = await Contact.findOneAndUpdate(filter, updates);

      if (!c) {
        //res.status(404).end()
	res.status(404).json({ error: 'Contact not found', id : id, updates: updates});
        return
      }
      res.status(200).json(c)
      return
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'PATCH'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('[/api/contacts/[id]]', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

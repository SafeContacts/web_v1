// pages/api/cashfree/check-link.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const { CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV } = process.env;
const CF_BASE = CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { link_id } = req.query as { link_id?: string };
  if (!link_id) return res.status(400).json({ error: 'link_id required' });

  try {
    // Fetch link details, including its payments :contentReference[oaicite:1]{index=1}
    const cfRes = await axios.get(`${CF_BASE}/links/${link_id}`, {
      headers: {
        'x-client-id':     CASHFREE_APP_ID!,
        'x-client-secret': CASHFREE_SECRET_KEY!,
        'x-api-version':   '2025-01-01'
      }
    });
    // You can inspect cfRes.data.payment and cfRes.data.link_status
    return res.status(200).json(cfRes.data);
  } catch (err: any) {
    console.error('Cashfree check-link error', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to check link status' });
  }
}


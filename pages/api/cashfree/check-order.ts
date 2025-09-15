// pages/api/cashfree/check-order.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const {
  CASHFREE_APP_ID,
  CASHFREE_SECRET_KEY,
  CASHFREE_ENV
} = process.env;

const CF_BASE = CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { order_id } = req.query as { order_id?: string };
  if (!order_id) {
    res.status(400).json({ error: 'order_id required' });
    return;
  }

  try {
    const cfRes = await axios.get(
      `${CF_BASE}/orders/${order_id}`,
      {
        headers: {
          'x-client-id':     CASHFREE_APP_ID!,
          'x-client-secret': CASHFREE_SECRET_KEY!,
          'x-api-version':   '2025-01-01'
        }
      }
    );

    // cfRes.data.order_status will be 'PAID' or 'FAILED' etc.
    const { order_status } = cfRes.data;
    return res.status(200).json({ order_status });
  } catch (err: any) {
    console.error('Cashfree check-order error', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to check order status' });
  }
}


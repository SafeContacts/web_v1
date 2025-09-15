// pages/api/cashfree/create-order.ts
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
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { orderId, orderAmount, customerPhone, customerEmail } = req.body;
  if (!orderId || !orderAmount || !customerPhone) {
    return res.status(400).json({ error: 'orderId, orderAmount & customerPhone required' });
  }

  const payload = {
    order_id:       orderId,
    order_amount:   orderAmount,
    order_currency: 'INR',
    customer_details: {
      customer_id:    customerPhone,
      customer_phone: customerPhone,
      customer_email: customerEmail || ''
    },
    order_meta: {
      return_url: `${req.headers.origin}/cashfree/success?order_id=${orderId}`
    }
  };

  try {
    const cfRes = await axios.post(
      `${CF_BASE}/orders`,
      payload,
      {
        headers: {
          'x-client-id':     CASHFREE_APP_ID!,
          'x-client-secret': CASHFREE_SECRET_KEY!,
          'x-api-version':   '2025-01-01',
          'Content-Type':    'application/json'
        }
      }
    );

    // The API response includes payment_link at top level
    const { payment_link } = cfRes.data;
    if (!payment_link) {
      console.error('No payment_link in response', cfRes.data);
      return res.status(502).json({ error: 'No payment link returned' });
    }

    return res.status(200).json({ payment_link });
  } catch (err: any) {
    console.error('Cashfree create-order error', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}


// pages/api/cashfree/create-link.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const { CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV } = process.env;
const CF_BASE = CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).end();
  }
  const { customerName, customerPhone, customerEmail, amount } = req.body;
  const origin = req.headers.origin;

  const payload = {
    link_name:     `SafeContacts Premium (${customerPhone})`,
    link_purpose:  'Subscription to SafeContacts Premium',
    link_amount:   amount,
    link_currency: 'INR',
    link_expiry:   Math.floor(Date.now()/1000) + 7*24*3600,
    customer_details: { customer_name: customerName, customer_phone: customerPhone, customer_email: customerEmail||'' },
    link_meta: {
      return_url: `${origin}/cashfree/success?link_id={link_id}`
    }
  };

  try {
    const cfRes = await axios.post(`${CF_BASE}/links`, payload, {
      headers: {
        'x-client-id':     CASHFREE_APP_ID!,
        'x-client-secret': CASHFREE_SECRET_KEY!,
        'x-api-version':   '2025-01-01',
        'Content-Type':    'application/json'
      }
    });
    const { link_url } = cfRes.data; 
    if (!link_url) {
      console.error('No link_url returned', cfRes.data);
      return res.status(502).json({ error: 'No payment link returned' });
    }
    return res.status(200).json({ link_url });
  } catch (err: any) {
    console.error('Cashfree create-link error', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to create payment link' });
  }
}


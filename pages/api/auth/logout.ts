import type { NextApiRequest, NextApiResponse } from 'next';
import { clearRefreshToken } from '../../../src/lib/cookies';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  clearRefreshToken(res);
  res.status(200).end();
}


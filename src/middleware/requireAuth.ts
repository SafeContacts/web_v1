import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { verifyToken } from '../lib/jwt';

export function requireAuth(handler: NextApiHandler, roles: string[] = []) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = req.headers.authorization?.split(' ')[1];
    //const auth = req.query.sc_refresh?.split(' ')[1];
    if (!auth) return res.status(401).json({ error: 'Missing token' });
    try {
      const payload: any = verifyToken(auth);
      console.log(auth)
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      (req as any).user = payload;
      (req as any).user.sub = payload;
      return handler(req, res);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}


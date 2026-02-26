// pages/api/user/settings.ts
// API to get and update user settings (stealth mode, etc.)
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { withAuth } from '../../../lib/auth';
import User from '../../../models/User';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  
  // Ensure database connection
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
  }

  try {
    switch (method) {
      case 'GET': {
        const userDoc = await User.findById(user.sub).lean() as Record<string, unknown> | null | undefined;
        if (!userDoc) {
          return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'User not found' });
        }
        
        return res.status(200).json({
          ok: true,
          stealthMode: userDoc.stealthMode || false,
          role: userDoc.role,
        });
      }
      
      case 'PUT': {
        const { stealthMode } = req.body;
        
        if (typeof stealthMode !== 'boolean') {
          return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'stealthMode must be a boolean' });
        }
        
        const userDoc = await User.findByIdAndUpdate(
          user.sub,
          { $set: { stealthMode } },
          { new: true }
        );
        
        if (!userDoc) {
          return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'User not found' });
        }
        
        return res.status(200).json({
          ok: true,
          stealthMode: userDoc.stealthMode,
        });
      }
      
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err: any) {
    console.error('User settings error:', err);
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to process request' });
  }
}

export default withAuth(handler);


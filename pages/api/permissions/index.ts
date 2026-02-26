// pages/api/permissions/index.ts
// API to manage user permissions
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { withAuth } from '../../../lib/auth';
import Permission from '../../../models/Permission';
import User from '../../../models/User';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure database connection
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        // Get permissions for current user
        let permission = await Permission.findOne({ userId: user.sub }).lean();
        
        if (!permission) {
          // Create default permissions
          permission = await Permission.create({
            userId: user.sub,
            permissions: {
              readCallLogs: false,
              readMessageLogs: false,
              readContacts: true,
              makeCalls: true,
              sendMessages: true,
              sendEmails: false,
            },
          });
        }
        
        return res.status(200).json({
          ok: true,
          permissions: (permission as { permissions?: unknown })?.permissions ?? {},
        });
      }
      
      case 'PUT': {
        // Update permissions (admin only or self)
        const { permissions } = req.body;
        const userDoc = await User.findById(user.sub).lean() as { role?: string } | null | undefined;
        
        if (!userDoc) {
          return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'User not found' });
        }
        
        // Only admin can grant permissions to others
        const { targetUserId } = req.body;
        const targetId = targetUserId || user.sub;
        
        if (targetId !== user.sub && userDoc.role !== 'admin') {
          return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'Only admin can grant permissions to others' });
        }
        
        const permission = await Permission.findOneAndUpdate(
          { userId: targetId },
          {
            $set: {
              permissions: permissions,
              grantedAt: new Date(),
              grantedBy: user.sub,
            },
          },
          { upsert: true, new: true }
        );
        
        return res.status(200).json({
          ok: true,
          permissions: permission.permissions,
        });
      }
      
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err: any) {
    console.error('Permissions error:', err);
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to process permissions' });
  }
}

export default withAuth(handler);


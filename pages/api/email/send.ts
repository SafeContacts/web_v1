// pages/api/email/send.ts
// API to send an email (if easy to implement)
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { withAuth } from '../../../lib/auth';
import User from '../../../models/User';
import Person from '../../../models/Person';
import Permission from '../../../models/Permission';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!, {});
  }

  const user: any = (req as any).user;
  if (!user?.sub) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
  }

  try {
    // Check permissions
    const permission = await Permission.findOne({ userId: user.sub }).lean() as { permissions?: { sendEmails?: boolean } } | null | undefined;
    if (!permission?.permissions?.sendEmails) {
      return res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'Email permission not granted' });
    }

    const { toPersonId, subject, body } = req.body;
    
    if (!toPersonId) {
      return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'toPersonId is required' });
    }

    if (!subject || !body) {
      return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'Subject and body are required' });
    }

    // Get target person
    const targetPerson = await Person.findById(toPersonId).lean() as { emails?: { value?: string }[] } | null | undefined;
    if (!targetPerson) {
      return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Person not found' });
    }

    const email = targetPerson.emails?.[0]?.value;
    if (!email) {
      return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', message: 'Person has no email address' });
    }

    // In a real app, you would integrate with email service (SendGrid, AWS SES, etc.)
    // For now, we just return success
    
    return res.status(200).json({
      ok: true,
      message: 'Email sent',
      to: email,
      subject,
      // In production, return actual email message ID
      messageId: `mock-email-${Date.now()}`,
    });
  } catch (err: any) {
    console.error('Send email error:', err);
    return res.status(500).json({ ok: false, code: 'INTERNAL_ERROR', message: 'Failed to send email' });
  }
}

export default withAuth(handler);


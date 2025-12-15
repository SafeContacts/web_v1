// models/Permission.ts
// Permissions for reading call logs, message logs, etc.
import mongoose, { Schema } from 'mongoose';

const PermissionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    permissions: {
      readCallLogs: { type: Boolean, default: false },
      readMessageLogs: { type: Boolean, default: false },
      readContacts: { type: Boolean, default: true },
      makeCalls: { type: Boolean, default: true },
      sendMessages: { type: Boolean, default: true },
      sendEmails: { type: Boolean, default: false },
    },
    grantedAt: { type: Date, default: Date.now },
    grantedBy: { type: String }, // Admin user ID who granted permissions
  },
  { timestamps: true },
);

PermissionSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);


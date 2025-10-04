/*** File: safecontacts/models/SyncSnapshot.ts */
import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * A snapshot of the user's device contacts at the time of the last sync.
 * Each user has at most one snapshot document.  When a sync request is
 * processed, the server compares the incoming contacts against the snapshot
 * to determine inserts, updates, and no-ops.  After processing, the
 * snapshot is replaced with the new set of contacts.
 */
export interface ISyncSnapshot extends Document {
  userId: string;
  contacts: any[];
  createdAt: Date;
  updatedAt: Date;
}

const SyncSnapshotSchema = new Schema<ISyncSnapshot>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    contacts: { type: Array, default: [] },
  },
  { timestamps: true }
);

export const SyncSnapshot: Model<ISyncSnapshot> =
  mongoose.models.SyncSnapshot || mongoose.model<ISyncSnapshot>('SyncSnapshot', SyncSnapshotSchema);

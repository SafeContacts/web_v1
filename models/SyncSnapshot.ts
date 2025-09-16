import { Schema, model, models } from 'mongoose';

const SyncSnapshotSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  contacts: [{
    phone:   String,
    name:    String,
    email:   String,
    company: String
  }],
  updatedAt: { type: Date, default: Date.now }
});

export default models.SyncSnapshot || model('SyncSnapshot', SyncSnapshotSchema);


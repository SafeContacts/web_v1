import { Schema, model, models } from 'mongoose';

const SyncDeltaSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  phone:    { type: String, required: true },
  field:    { type: String, required: true },
  oldValue: { type: String },
  newValue: { type: String },
  type:     { type: String, enum: ['new','update','delete'], required: true },
  resolved: { type: Boolean, default: false },
  createdAt:{ type: Date, default: Date.now }
});

export default models.SyncDelta || model('SyncDelta', SyncDeltaSchema);


// models/CallLog.ts
import { Schema, model, models } from 'mongoose';

const CallLogSchema = new Schema({
  contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: false },
  phone:     { type: String, required: true },
  outgoing:  { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now }
});

export default models.CallLog || model('CallLog', CallLogSchema);


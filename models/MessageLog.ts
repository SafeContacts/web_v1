// models/MessageLog.ts
import { Schema, model, models } from 'mongoose';

const MessageLogSchema = new Schema({
  contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: false },
  phone:     { type: String, required: true },
  outgoing:  { type: Boolean, default: true },
  message:   { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

export default models.MessageLog || model('MessageLog', MessageLogSchema);


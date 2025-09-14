// models/UpdateEvent.ts
import { Schema, model, models } from 'mongoose';

const UpdateEventSchema = new Schema({
  contactId:  { type: Schema.Types.ObjectId, ref: 'Contact', required: true },
  field:      { type: String, required: true },    // e.g. 'phone', 'email'
  oldValue:   { type: String, required: true },
  newValue:   { type: String, required: true },
  stealth:    { type: Boolean, default: true },
  createdAt:  { type: Date, default: Date.now }
});

export default models.UpdateEvent || model('UpdateEvent', UpdateEventSchema);


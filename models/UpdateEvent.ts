// models/UpdateEvent.ts
import { Schema, model, models } from 'mongoose';

const UpdateEventSchema = new Schema({
  contactId:  { type: Schema.Types.ObjectId, ref: 'Contact' }, // Optional, for backward compatibility
  personId:   { type: Schema.Types.ObjectId, ref: 'Person', index: true }, // Person being updated
  fromUserId: { type: String, required: true, index: true }, // User who made the update
  field:      { type: String, required: true },    // e.g. 'phone', 'email', 'address'
  oldValue:   { type: String, required: true },
  newValue:   { type: String, required: true },
  stealth:    { type: Boolean, default: true }, // If true, only visible to 1st connections
  applied:    { type: Boolean, default: false }, // Whether update has been applied
  createdAt:  { type: Date, default: Date.now, index: true }
});

// Index for finding updates for a person
UpdateEventSchema.index({ personId: 1, field: 1, applied: 1, stealth: 1 });
// Index for finding updates from a user
UpdateEventSchema.index({ fromUserId: 1, createdAt: -1 });

export default models.UpdateEvent || model('UpdateEvent', UpdateEventSchema);


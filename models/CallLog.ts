/* File:: models/CallLog.ts */
import mongoose, { Schema } from "mongoose";

/**
 * CallLog stores a record of calls or messages between two people.  Each
 * log entry captures who initiated the interaction (`fromPersonId`), who
 * received it (`toPersonId`), the owning user (`userId`), the type of
 * interaction (call or sms), the duration of the call in seconds (for
 * calls), and when it occurred (`timestamp`).
 */
const CallLogSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    fromPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true, index: true },
    toPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true, index: true },
    type: { type: String, enum: ["call", "sms"], required: true },
    duration: { type: Number, default: 0 },
    timestamp: { type: Date, required: true },
  },
  { timestamps: true },
);

// Index for efficient queries on call history.
CallLogSchema.index({ fromPersonId: 1, toPersonId: 1, timestamp: -1 });

export default mongoose.models.CallLog ||
  mongoose.model("CallLog", CallLogSchema);



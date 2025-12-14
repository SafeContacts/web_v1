import mongoose, { Schema } from "mongoose";

/**
 * BlockedContact represents a blocked relationship between a user and a person.
 * Users can block contacts by phone number or personId.
 */
const BlockedContactSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    personId: { type: Schema.Types.ObjectId, ref: "Person", index: true },
    phoneNumber: { type: String, index: true }, // Alternative to personId
    blockedAt: { type: Date, default: Date.now },
    reason: { type: String, default: "" },
  },
  { timestamps: true },
);

// Unique index on userId and personId (if personId is provided)
BlockedContactSchema.index({ userId: 1, personId: 1 }, { unique: true, sparse: true });
// Unique index on userId and phoneNumber (if phoneNumber is provided)
BlockedContactSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true, sparse: true });

export default mongoose.models.BlockedContact ||
  mongoose.model("BlockedContact", BlockedContactSchema);


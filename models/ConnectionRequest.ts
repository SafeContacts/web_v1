import mongoose, { Schema } from "mongoose";

/**
 * ConnectionRequest represents a request from one user to connect with another person.
 * The request can be pending, approved, or rejected.
 */
const ConnectionRequestSchema = new Schema(
  {
    fromUserId: { type: String, required: true, index: true },
    fromPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true, index: true },
    toPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    message: { type: String, default: "" }, // Optional message with the request
    requestCount: { type: Number, default: 1 }, // Track number of requests sent for this pair
  },
  { timestamps: true },
);

// Index on fromPersonId and toPersonId (not unique anymore, to allow retries)
ConnectionRequestSchema.index({ fromPersonId: 1, toPersonId: 1 });
ConnectionRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.ConnectionRequest ||
  mongoose.model("ConnectionRequest", ConnectionRequestSchema);


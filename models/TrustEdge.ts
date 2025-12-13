import mongoose, { Schema } from "mongoose";

const TrustEdgeSchema = new Schema(
  {
    fromPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    toPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    level: { type: Number, default: 1 },
  },
  { timestamps: true },
);

TrustEdgeSchema.index({ fromPersonId: 1, toPersonId: 1 }, { unique: true });

export default mongoose.models.TrustEdge || mongoose.model("TrustEdge", TrustEdgeSchema);


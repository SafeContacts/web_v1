import mongoose, { Schema } from "mongoose";

const ContactAliasSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    personId: { type: Schema.Types.ObjectId, ref: "Person", required: true, index: true },
    alias: { type: String, required: true },
    tags: { type: [String], default: [] },
    notes: { type: String, default: "" },
    lastContactedAt: { type: Date },
  },
  { timestamps: true },
);

ContactAliasSchema.index({ userId: 1, personId: 1 }, { unique: true });

export default mongoose.models.ContactAlias || mongoose.model("ContactAlias", ContactAliasSchema);


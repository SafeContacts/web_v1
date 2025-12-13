import mongoose, { Schema } from "mongoose";

/**
 * ContactEdge represents a directed “knows” relationship between two Person
 * documents.  When a user adds someone to their contacts, an edge is created
 * from the user’s person to the other person.  A `weight` field may be used
 * to record the number of times this relationship has been observed.
 */
const ContactEdgeSchema = new Schema(
  {
    fromPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    toPersonId: { type: Schema.Types.ObjectId, ref: "Person", required: true },
    weight: { type: Number, default: 1 },
    lastContactedAt: { type: Date },
  },
  { timestamps: true },
);

// Prevent duplicate edges between the same pair of people.
ContactEdgeSchema.index({ fromPersonId: 1, toPersonId: 1 }, { unique: true });

export default mongoose.models.ContactEdge ||
  mongoose.model("ContactEdge", ContactEdgeSchema);


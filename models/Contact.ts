/* FILE : model/contacts.ts */
import mongoose, { Schema } from "mongoose";

const PhoneSchema = new Schema({
  label: { type: String, default: "mobile" },
  value: { type: String, required: true },
});

const EmailSchema = new Schema({
  label: { type: String, default: "work" },
  value: { type: String, required: true, lowercase: true, trim: true },
});

const ContactSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phones: { type: [PhoneSchema], default: [] },
    emails: { type: [EmailSchema], default: [] },
    addresses: { type: [String], default: [] },
    notes: { type: String, default: "" },
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    company: { type: String },
    tags: { type: [String], default: [] },
    linkedIn: { type: String },
    twitter: { type: String },
    isRegistered: {type: Boolean},
    instagram: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.Contact || mongoose.model("Contact", ContactSchema);

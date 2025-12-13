import mongoose, { Schema } from "mongoose";

const PhoneSchema = new Schema({
  label: { type: String, default: "mobile" },
  value: { type: String, required: true },
  e164: { type: String, index: true },
});

const EmailSchema = new Schema({
  label: { type: String, default: "work" },
  value: { type: String, required: true, lowercase: true, trim: true },
});

const PersonSchema = new Schema(
  {
    phones: { type: [PhoneSchema], default: [] },
    emails: { type: [EmailSchema], default: [] },
    addresses: { type: [String], default: [] },
    socials: {
      linkedIn: { type: String },
      twitter: { type: String },
      instagram: { type: String },
    },
    registeredUserId: { type: String, index: true, default: null },
  },
  { timestamps: true },
);

PersonSchema.index({ "phones.e164": 1 });
PersonSchema.index({ "emails.value": 1 });

// Delete the model from cache if it exists to ensure fresh schema
if (mongoose.models.Person) {
  delete mongoose.models.Person;
}

export default mongoose.model("Person", PersonSchema);


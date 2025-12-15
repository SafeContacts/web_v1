/* FILE : model/contacts.ts */
import mongoose, { Schema } from "mongoose";
import { encrypt, decrypt, encryptArray, decryptArray } from "../lib/encryption";

const PhoneSchema = new Schema({
  label: { type: String, default: "mobile" },
  value: { type: String, required: true },
  countryCode: { type: String, default: "+91" }, // Store country code separately
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
    encrypted: { type: Boolean, default: true }, // Flag to indicate if data is encrypted
  },
  { timestamps: true },
);

// Encrypt before saving
ContactSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('phones') || this.isModified('emails') || this.isModified('addresses') || this.isModified('notes')) {
    if (this.encrypted !== false) {
      try {
        // Encrypt sensitive fields
        if (this.phones && Array.isArray(this.phones)) {
          const phonesArray = this.phones as any[];
          phonesArray.forEach((p: any) => {
            if (typeof p.value === 'string' && !p.value.match(/^[0-9a-f]{128,}$/i)) {
              p.value = encrypt(p.value);
            }
          });
        }
        if (this.emails && Array.isArray(this.emails)) {
          const emailsArray = this.emails as any[];
          emailsArray.forEach((e: any) => {
            if (typeof e.value === 'string' && !e.value.match(/^[0-9a-f]{128,}$/i)) {
              e.value = encrypt(e.value);
            }
          });
        }
        if (this.addresses && Array.isArray(this.addresses)) {
          const addressesArray = this.addresses as any[];
          addressesArray.forEach((addr: any, index: number) => {
            if (typeof addr === 'string' && !addr.match(/^[0-9a-f]{128,}$/i)) {
              addressesArray[index] = encrypt(addr);
            }
          });
        }
        if (this.notes && typeof this.notes === 'string' && !this.notes.match(/^[0-9a-f]{128,}$/i)) {
          (this as any).notes = encrypt(this.notes);
        }
      } catch (err) {
        console.error('Encryption error:', err);
      }
    }
  }
  next();
});

// Note: We do NOT decrypt automatically on load
// Decryption should only happen in API routes for authorized users
// This keeps data encrypted in storage at all times

// Method to decrypt contact data (only call for authorized users)
ContactSchema.methods.decryptForUser = function() {
  const doc = this.toObject ? this.toObject() : this;
  if (doc.encrypted !== false) {
    try {
      if (doc.phones && Array.isArray(doc.phones)) {
        doc.phones = doc.phones.map((p: any) => ({
          ...p,
          value: decrypt(p.value),
        }));
      }
      if (doc.emails && Array.isArray(doc.emails)) {
        doc.emails = doc.emails.map((e: any) => ({
          ...e,
          value: decrypt(e.value),
        }));
      }
      if (doc.addresses && Array.isArray(doc.addresses)) {
        doc.addresses = doc.addresses.map((addr: string) => decrypt(addr));
      }
      if (doc.notes) {
        doc.notes = decrypt(doc.notes);
      }
    } catch (err) {
      console.error('Decryption error:', err);
    }
  }
  return doc;
};

export default mongoose.models.Contact || mongoose.model("Contact", ContactSchema);

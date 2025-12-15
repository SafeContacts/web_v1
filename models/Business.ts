import { Schema, model, models } from 'mongoose';

const BusinessSchema = new Schema({
  businessId: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  category: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  description: { type: String },
  rating: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

export default models.Business || model('Business', BusinessSchema);

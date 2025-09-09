import { Schema, model, models } from 'mongoose';

const BusinessSchema = new Schema({
  businessId: String,
  name: String,
  category: String,
  phone: String,
  rating: Number,
  verified: { type: Boolean, default: false }
});

export default models.Business || model('Business', BusinessSchema);

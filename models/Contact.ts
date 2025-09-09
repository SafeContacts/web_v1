import { Schema, model, models } from 'mongoose';

const ContactSchema = new Schema({
  userId: String,
  name: String,
  phone: String,
  email: String,
  confidenceScore: Number
});

export default models.Contact || model('Contact', ContactSchema);

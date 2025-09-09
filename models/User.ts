import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  phone: { type: String, unique: true },
  name: String,
  publicProfile: { type: Boolean, default: true }
});

export default models.User || model('User', UserSchema);

import { Schema, model, models } from 'mongoose';

const TrustEdgeSchema = new Schema({
  fromUser: String,
  toUser: String,
  confirmed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default models.TrustEdge || model('TrustEdge', TrustEdgeSchema);

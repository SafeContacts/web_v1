import { Schema, model, models } from 'mongoose';
const RatingSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref:'BusinessProfile', required:true },
  userId:     { type: Schema.Types.ObjectId, ref:'User',            required:true },
  score:      { type: Number, min:1, max:5, required:true },
  comment:    String,
  createdAt:  { type: Date, default: Date.now }
});
export default models.Rating || model('Rating', RatingSchema);


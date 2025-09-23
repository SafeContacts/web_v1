import { Schema, model, models } from 'mongoose';
const ActivitySchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref:'User', required:true },
  type:      { type: String, enum:['login','import','apply_network'], required:true },
  createdAt: { type: Date, default: Date.now }
});
export default models.UserActivity||model('UserActivity',ActivitySchema);


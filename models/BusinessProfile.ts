import { Schema, model, models } from 'mongoose';

const BusinessProfileSchema = new Schema({
  phone:      { type: String, unique:true, required:true },
  name:       { type: String, required:true },
  description:{ type: String },
  address:    String,
  website:    String,
  verified:   { type: Boolean, default:false },
  ownerRef:   { type: Schema.Types.ObjectId, ref:'User' }
});
export default models.BusinessProfile ||
       model('BusinessProfile', BusinessProfileSchema);


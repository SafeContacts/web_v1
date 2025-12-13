//./model/User.ts
import { Schema, model, models, Document } from 'mongoose';

const UserSchema = new Schema({
  phone:        { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  username:     { type: String, required: true },
  personId: 	{ type: Schema.Types.ObjectId, ref: "Person", required: true },
  role:         { type: String, enum: ['admin','user','business'], default: 'user' }
});

export default models.User || model("User", UserSchema);

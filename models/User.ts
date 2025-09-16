//./model/User.ts
import { Schema, model, models, Document } from 'mongoose';

export interface IUser extends Document {
  phone:        string;
  passwordHash: string;
  name:         string;
  role:         'admin' | 'user' | 'business';
}

const UserSchema = new Schema<IUser>({
  phone:        { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  name:         { type: String, required: true },
  role:         { type: String, enum: ['admin','user','business'], default: 'user' }
});

export default models.User || model<IUser>('User', UserSchema);


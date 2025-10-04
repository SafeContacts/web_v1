import { Schema, model, models, Document } from 'mongoose';


const HandleSchema = new Schema({
platform: { type: String, enum: ['whatsapp','telegram','instagram','x','linkedin','messenger'], index: true },
value: { type: String, index: true },
verified: { type: Boolean, default: false },
verification_method: { type: String },
last_checked_at: { type: Date },
consent_collected: { type: Boolean, default: false },
metadata: { type: Schema.Types.Mixed },
}, {_id: false});

export interface IContact extends Document {
  phone:           string;
  name:            string;
  email:           string;
  company:         string;
  address:         string;
  jobTitle:        string;
  birthday:        Date;
  tags:            string[];
  confidenceScore: number;
  isRegistered:    boolean;
  userRef:         Schema.Types.ObjectId;
}

const ContactSchema = new Schema<IContact>({
  phone:           { type: String, unique: true, required: true },
  name:            { type: String, required: true },
  email:           String,
  company:         String,
  address:         String,
  jobTitle:        String,
  birthday:        Date,
  tags:            [String],
  confidenceScore: { type: Number, default: 0 },
  isRegistered:    { type: Boolean, default: false },
  userRef:         { type: Schema.Types.ObjectId, ref: 'User' }
});

//export default models.Contact || model<IContact>('Contact', ContactSchema);
export const Contact: Model<IContact> = models.Contact || model<IContact>('Contact', ContactSchema);


// File:: models/CallLog.ts
import {Schema, model, models } from 'mongoose';

export interface ICallLog extends Document {
   userId: string;
   contactId?: string;
   phoneNumber: string;
   type: 'incoming' | 'outgoing' | 'missed';
   /** Duration of the call in seconds. Optional, defaults to 0 if unknown. */
   duration?: number;
   timestamp: Date;
   createdAt: Date;
   updatedAt: Date;
}


const CallLogSchema = new Schema<ICallLog>(
  {
    userId: { type: String, required: true, index: true },
    contactId: { type: String },
    phoneNumber: { type: String, required: true },
    type: { type: String, enum: ['incoming', 'outgoing', 'missed'], required: true },
    timestamp: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);


//export const CallLog: Model<ICallLog> = models.CallLog || model<ICallLog>('CallLog', CallLogSchema);

export default models.CallLog || model('CallLog', CallLogSchema);



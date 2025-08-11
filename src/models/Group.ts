import { Schema, model, models } from 'mongoose';

const GroupSchema = new Schema(
  {
    name: { type: String, required: true },
    monthlyAmount: { type: Number, required: true, default: 0 },
    reminderDayOfMonth: { type: Number, default: 1 },
    sendTime: { type: String, default: '09:00' },
    timeZone: { type: String, default: 'Asia/Kolkata' },
    approvalThreshold: { type: Number, default: 0.6 },
    pauseReminders: { type: Boolean, default: false },
    interestRateMonthly: { type: Number, default: 0 },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const GroupModel = models.Group || model('Group', GroupSchema);
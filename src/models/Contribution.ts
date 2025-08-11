import { Schema, model, models } from 'mongoose';

const ContributionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    period: { type: String, required: true }, // YYYY-MM
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    utr: String,
    proof: { url: String, publicId: String }
  },
  { timestamps: true }
);
ContributionSchema.index({ userId: 1, groupId: 1, period: 1 }, { unique: true });

export const ContributionModel = models.Contribution || model('Contribution', ContributionSchema);
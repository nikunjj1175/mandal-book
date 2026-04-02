const mongoose = require('mongoose');

const splitRowSchema = new mongoose.Schema(
  {
    memberKey: { type: String, required: true },
    shareAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const splitExpenseSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'SplitTrip', required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    amount: { type: Number, required: true, min: 0.01 },
    paidByMemberKey: { type: String, required: true },
    splits: {
      type: [splitRowSchema],
      required: true,
      validate: [(v) => Array.isArray(v) && v.length >= 2, 'At least two people must share'],
    },
    incurredOn: { type: Date, default: Date.now },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

splitExpenseSchema.index({ tripId: 1, incurredOn: -1 });

module.exports = mongoose.models.SplitExpense || mongoose.model('SplitExpense', splitExpenseSchema);

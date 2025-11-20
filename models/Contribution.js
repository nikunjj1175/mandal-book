const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },
    slipImage: { type: String, required: true },
    upiProvider: {
      type: String,
      enum: ['gpay', 'phonepe'],
      default: 'gpay',
    },
    ocrStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    ocrData: {
      transactionId: { type: String, unique: true, sparse: true },
      amount: { type: Number },
      date: { type: String },
      time: { type: String },
      payeeName: { type: String },
      rawText: { type: String },
    },
    status: {
      type: String,
      enum: ['pending', 'done', 'rejected'],
      default: 'pending',
    },
    adminRemarks: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ContributionSchema.index({ userId: 1, month: 1 }, { unique: true });
ContributionSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.Contribution || mongoose.model('Contribution', ContributionSchema);


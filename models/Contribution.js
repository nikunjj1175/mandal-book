const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['upi', 'cash'],
      default: 'upi',
      required: true,
    },
    slipImage: { type: String }, // Optional for cash payments
    upiProvider: {
      type: String,
      enum: ['gpay', 'phonepe'],
    },
    ocrStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    ocrData: {
      transactionId: { type: String },
      amount: { type: Number },
      date: { type: String },
      time: { type: String },
      payeeName: { type: String },
      rawText: { type: String },
    },
    paymentDate: { type: Date }, // Payment date extracted from OCR or set by admin
    // Extra metadata related to how the payment/QR was generated
    upiVpa: { type: String },
    generatedBySystem: { type: Boolean, default: false },
    upiNote: { type: String },
    paymentIntentId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'done', 'rejected'],
      default: 'pending',
    },
    adminRemarks: { type: String },
    enteredBy: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries and constraints
// Same user cannot upload contribution twice for same month
ContributionSchema.index({ userId: 1, month: 1 }, { unique: true });
// Same user cannot reuse same transactionId; other users can
ContributionSchema.index(
  { userId: 1, 'ocrData.transactionId': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'ocrData.transactionId': { $type: 'string', $exists: true, $ne: '' },
    },
  }
);

module.exports = mongoose.models.Contribution || mongoose.model('Contribution', ContributionSchema);


const mongoose = require('mongoose');

const PinVerificationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    success: {
      type: Boolean,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: 'Unknown',
    },
    userAgent: {
      type: String,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

PinVerificationLogSchema.index({ userId: 1, attemptedAt: -1 });
PinVerificationLogSchema.index({ attemptedAt: -1 });

module.exports =
  mongoose.models.PinVerificationLog || mongoose.model('PinVerificationLog', PinVerificationLogSchema);

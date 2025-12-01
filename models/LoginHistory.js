const mongoose = require('mongoose');

const LoginHistorySchema = new mongoose.Schema(
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
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    loginAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
LoginHistorySchema.index({ userId: 1, loginAt: -1 });
LoginHistorySchema.index({ loginAt: -1 });

module.exports = mongoose.models.LoginHistory || mongoose.model('LoginHistory', LoginHistorySchema);


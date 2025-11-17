const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true },
    amount: { type: Number, required: true },
    slipImage: { type: String, required: true },
    referenceId: { type: String },
    ocrStatus: { 
      type: String, 
      enum: ['pending', 'success', 'failed'], 
      default: 'pending' 
    },
    ocrData: {
      referenceId: { type: String },
      amount: { type: Number },
      date: { type: String },
      time: { type: String },
    },
    status: { 
      type: String, 
      enum: ['pending', 'done', 'rejected'], 
      default: 'pending' 
    },
    adminRemarks: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ContributionSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.models.Contribution || mongoose.model('Contribution', ContributionSchema);


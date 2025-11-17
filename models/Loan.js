const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    interestRate: { type: Number, default: 0 },
    duration: { type: Number, default: 12 },
    pendingAmount: { type: Number, required: true },
    installmentsPaid: [{
      amount: { type: Number },
      date: { type: Date },
      referenceId: { type: String },
    }],
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'active', 'closed'], 
      default: 'pending' 
    },
    reason: { type: String },
    adminRemarks: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);


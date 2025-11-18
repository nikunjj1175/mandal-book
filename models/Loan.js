const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    interestRate: { type: Number, default: 0 },
    interestAmount: { type: Number, default: 0 }, // Total interest amount
    totalPayable: { type: Number, default: 0 }, // Principal + Interest
    duration: { type: Number, default: 12 },
    pendingAmount: { type: Number, required: true },
    installmentsPaid: [{
      amount: { type: Number },
      date: { type: Date },
      referenceId: { type: String },
      slipImage: { type: String },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
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


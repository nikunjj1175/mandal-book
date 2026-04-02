const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
  {
    investmentName: { type: String, required: true, trim: true },
    purchaseAmount: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date },
    vendorName: { type: String, trim: true },
    notes: { type: String, trim: true },
    documentUrl: { type: String, required: true },
    documentPublicId: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

InvoiceSchema.index({ investmentName: 1, purchaseDate: -1 });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);


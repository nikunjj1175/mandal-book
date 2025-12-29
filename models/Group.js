const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    // Feature flags: control which modules are enabled for this group
    features: {
      contributions: { type: Boolean, default: true },
      loans: { type: Boolean, default: true },
      members: { type: Boolean, default: true },
      kyc: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Group || mongoose.model('Group', GroupSchema);



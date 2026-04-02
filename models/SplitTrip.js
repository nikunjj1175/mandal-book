const mongoose = require('mongoose');

const tripMemberSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    displayName: { type: String, required: true, trim: true, maxlength: 120 },
    linkedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const splitTripSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [tripMemberSchema], default: [] },
  },
  { timestamps: true }
);

splitTripSchema.index({ createdAt: -1 });
splitTripSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.models.SplitTrip || mongoose.model('SplitTrip', splitTripSchema);

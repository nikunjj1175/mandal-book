const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    profilePic: { type: String },
    emailVerified: { type: Boolean, default: false },
    emailOTP: { type: String },
    emailOTPExpiresAt: { type: Date },
    adminApprovalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminApprovalRemarks: { type: String },
    adminApprovedAt: { type: Date },
    
    dob: { type: String },
    address: { type: String },
    aadhaarNumber: { type: String },
    aadhaarFront: { type: String },
    panNumber: { type: String },
    panImage: { type: String },
    bankDetails: {
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
      accountHolderName: { type: String },
      passbookImage: { type: String },
    },
    
    kycStatus: { 
      type: String, 
      enum: ['pending', 'under_review', 'verified', 'rejected'], 
      default: 'pending' 
    },
    kycRemarks: { type: String },
    
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);


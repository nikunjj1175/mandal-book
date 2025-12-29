const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Role hierarchy:
    // - super_admin: full system control (can manage admins & global settings)
    // - admin: manages members, KYC, contributions, loans
    // - member: normal user
    role: { type: String, enum: ['super_admin', 'admin', 'member'], default: 'member' },
    profilePic: { type: String },
    emailVerified: { type: Boolean, default: false },
    emailOTP: { type: String },
    emailOTPExpiresAt: { type: Date },
    resetPasswordOTP: { type: String },
    resetPasswordOTPExpiresAt: { type: Date },
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
    
    isActive: { type: Boolean, default: true },
    deactivatedAt: { type: Date },
    deactivationReason: { type: String },
    
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);


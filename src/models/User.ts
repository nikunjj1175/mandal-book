import mongoose, { Schema, model, models } from 'mongoose';

export type Role = 'admin' | 'member';
export type UserStatus = 'pending' | 'active' | 'suspended';

const BankSchema = new Schema(
  {
    accountHolderName: String,
    accountNumber: String,
    ifsc: String,
    bankName: String,
    branch: String
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'IN' }
  },
  { _id: false }
);

const DocumentSchema = new Schema(
  {
    type: { type: String },
    url: String,
    publicId: String
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },

    profileImage: { url: String, publicId: String },

    aadhaarNumberEncrypted: String,
    panNumberEncrypted: String,

    documents: [DocumentSchema],
    address: AddressSchema,
    bank: BankSchema
  },
  { timestamps: true }
);

export const UserModel = models.User || model('User', UserSchema);
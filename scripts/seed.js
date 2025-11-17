/* eslint-disable no-console */
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.local'),
});

const connectDB = require('../lib/mongodb');
const User = require('../models/User');
const Contribution = require('../models/Contribution');
const Loan = require('../models/Loan');
const Notification = require('../models/Notification');

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seeding is disabled in production environments.');
    process.exit(1);
  }

  await connectDB();
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Contribution.deleteMany({}),
    Loan.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('Cleared existing collections');

  const hashedPassword = await bcrypt.hash('Password@123', 10);
  const baseBankDetails = {
    accountNumber: '1234567890',
    ifscCode: 'MAND0001234',
    bankName: 'Mandal Cooperative Bank',
    accountHolderName: 'Mandal User',
    passbookImage: 'https://placehold.co/400x250?text=Passbook',
  };

  const usersPayload = Array.from({ length: 10 }).map((_, index) => {
    const isAdmin = index === 0;
    return {
      name: isAdmin ? 'Mandal Admin' : `Member User ${index}`,
      email: isAdmin ? 'admin@mandal-book.com' : `member${index}@mandal-book.com`,
      mobile: `90000000${index}${index}`,
      password: hashedPassword,
      role: isAdmin ? 'admin' : 'member',
      profilePic: `https://i.pravatar.cc/150?img=${index + 5}`,
      dob: '1990-01-15',
      address: '123 Mandal Street, Finance City',
      aadhaarNumber: `1234 5678 90${index}${index}`,
      aadhaarFront: 'https://placehold.co/400x250?text=Aadhaar+Front',
      aadhaarBack: 'https://placehold.co/400x250?text=Aadhaar+Back',
      panNumber: `ABCDE12${index}${index}`,
      panImage: 'https://placehold.co/400x250?text=PAN',
      bankDetails: baseBankDetails,
      kycStatus: isAdmin ? 'verified' : index % 3 === 0 ? 'verified' : 'pending',
      kycRemarks: '',
      emailVerified: true,
      adminApprovalStatus: 'approved',
      adminApprovedAt: new Date(),
    };
  });

  const createdUsers = await User.insertMany(usersPayload);
  console.log('Inserted users');

  const memberUsers = createdUsers.filter((user) => user.role === 'member').slice(0, 10);

  const contributionsPayload = memberUsers.map((member, index) => ({
    userId: member._id,
    month: `2025-${String((index % 12) + 1).padStart(2, '0')}`,
    amount: 2000 + index * 100,
    slipImage: `https://placehold.co/600x400?text=Slip+${index + 1}`,
    referenceId: `UTR00${index}${index}${index}`,
    ocrStatus: 'success',
    ocrData: {
      referenceId: `UTR00${index}${index}${index}`,
      amount: 2000 + index * 100,
      date: `2025-0${(index % 9) + 1}-05`,
      time: '10:30',
    },
    status: index % 4 === 0 ? 'done' : index % 3 === 0 ? 'rejected' : 'pending',
    adminRemarks: index % 4 === 0 ? 'Verified payment' : '',
  }));

  await Contribution.insertMany(contributionsPayload);
  console.log('Inserted contributions');

  const loansPayload = memberUsers.map((member, index) => ({
    userId: member._id,
    amount: 5000 + index * 500,
    interestRate: 12,
    duration: 12,
    pendingAmount: 5000 + index * 500 - index * 100,
    installmentsPaid: [
      {
        amount: 500,
        date: new Date(),
        referenceId: `LOANINST${index}`,
      },
    ],
    status: index % 3 === 0 ? 'active' : index % 2 === 0 ? 'pending' : 'approved',
    reason: 'Short term cash need',
    adminRemarks: 'Reviewed by admin',
  }));

  await Loan.insertMany(loansPayload);
  console.log('Inserted loans');

  const notificationTypes = ['kyc', 'contribution', 'loan', 'system'];
  const notificationsPayload = memberUsers.map((member, index) => ({
    userId: member._id,
    title: `Update ${index + 1}`,
    description: `Sample notification message #${index + 1}`,
    type: notificationTypes[index % notificationTypes.length],
    isRead: index % 2 === 0,
    relatedId: member._id,
  }));

  await Notification.insertMany(notificationsPayload);
  console.log('Inserted notifications');

  console.log('Database seeded with 10 records per collection ✅');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});


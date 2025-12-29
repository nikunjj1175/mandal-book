require('dotenv').config({ path: '.env' });
const connectDB = require('../lib/mongodb');
const User = require('../models/User');
const Group = require('../models/Group');
const Contribution = require('../models/Contribution');
const Loan = require('../models/Loan');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    await connectDB();

    console.log('Seeding demo data...');

    // Clear existing demo data (optional)
    await Promise.all([
      Group.deleteMany({}),
      User.deleteMany({ role: { $ne: 'super_admin' } }),
      Contribution.deleteMany({}),
      Loan.deleteMany({}),
    ]);

    // Create two demo groups with different feature sets
    const mainGroup = await Group.create({
      name: 'Main Mandal Group',
      code: 'MAIN',
      description: 'Primary mandal for demo',
      features: { contributions: true, loans: true, members: true, kyc: true },
    });

    const loansOnlyGroup = await Group.create({
      name: 'Loans-Only Group',
      code: 'LOAN-GRP',
      description: 'Group with loans enabled but contributions disabled',
      features: { contributions: false, loans: true, members: true, kyc: true },
    });

    // Create demo admins for each group
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

    const mainAdmin = await User.create({
      name: 'Main Group Admin',
      email: 'main-admin@example.com',
      mobile: '9000000001',
      password: adminPasswordHash,
      role: 'admin',
      groupId: mainGroup._id,
      emailVerified: true,
      adminApprovalStatus: 'approved',
      isActive: true,
    });

    const loanAdmin = await User.create({
      name: 'Loans Group Admin',
      email: 'loans-admin@example.com',
      mobile: '9000000002',
      password: adminPasswordHash,
      role: 'admin',
      groupId: loansOnlyGroup._id,
      emailVerified: true,
      adminApprovalStatus: 'approved',
      isActive: true,
    });

    // Create demo members in main group
    const memberPasswordHash = await bcrypt.hash('Member@123', 10);

    const members = await User.insertMany([
      {
        name: 'Demo Member One',
        email: 'member1@example.com',
        mobile: '9100000001',
        password: memberPasswordHash,
        role: 'member',
        groupId: mainGroup._id,
        emailVerified: true,
        adminApprovalStatus: 'approved',
        kycStatus: 'verified',
        isActive: true,
      },
      {
        name: 'Demo Member Two',
        email: 'member2@example.com',
        mobile: '9100000002',
        password: memberPasswordHash,
        role: 'member',
        groupId: mainGroup._id,
        emailVerified: true,
        adminApprovalStatus: 'approved',
        kycStatus: 'verified',
        isActive: true,
      },
    ]);

    // Create demo contributions for member1
    const [member1, member2] = members;

    await Contribution.insertMany([
      {
        userId: member1._id,
        month: '2025-01',
        amount: 1000,
        slipImage: 'https://via.placeholder.com/300x300.png?text=Slip+Jan',
        upiProvider: 'gpay',
        status: 'done',
      },
      {
        userId: member1._id,
        month: '2025-02',
        amount: 1000,
        slipImage: 'https://via.placeholder.com/300x300.png?text=Slip+Feb',
        upiProvider: 'phonepe',
        status: 'done',
      },
      {
        userId: member2._id,
        month: '2025-02',
        amount: 800,
        slipImage: 'https://via.placeholder.com/300x300.png?text=Slip+Feb',
        upiProvider: 'gpay',
        status: 'pending',
      },
    ]);

    // Create a demo loan for member1
    await Loan.create({
      userId: member1._id,
      amount: 5000,
      interestRate: 12,
      interestAmount: 600,
      totalPayable: 5600,
      duration: 12,
      pendingAmount: 5600,
      status: 'approved',
      reason: 'Demo personal loan',
    });

    console.log('Demo data seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seed script error:', err);
    process.exit(1);
  }
}

run();



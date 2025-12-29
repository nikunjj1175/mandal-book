const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI;
console.log(MONGODB_URI);
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
        console.log('MongoDB connected successfully');

        // Ensure a single super admin user exists (idempotent)
        try {
          const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
          const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

          if (superAdminEmail && superAdminPassword) {
            const existingSuperAdmin = await User.findOne({ role: 'super_admin', email: superAdminEmail });
            if (!existingSuperAdmin) {
              const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
              await User.create({
                name: process.env.SUPER_ADMIN_NAME,
                email: superAdminEmail,
                mobile: process.env.SUPER_ADMIN_MOBILE,
                password: hashedPassword,
                role: 'super_admin',
                emailVerified: true,
                adminApprovalStatus: 'approved',
                isActive: true,
              });
              console.log('Super admin user created automatically');
            }
          }
        } catch (seedError) {
          console.error('Failed to ensure super admin user:', seedError);
        }

        return mongooseInstance;
      });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = connectDB;


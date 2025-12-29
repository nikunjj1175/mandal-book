import applyCors from '@/lib/cors';
const connectDB = require('../../../../lib/mongodb');
const User = require('../../../../models/User');
const { authenticate, requireSuperAdmin } = require('../../../../middleware/auth');
const { handleApiError, generateOTP, getOtpExpiryDate } = require('../../../../lib/utils');
const { sendOTPEmail } = require('../../../../lib/email');
const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireSuperAdmin(req);

    const { email, name } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Admin email is required',
      });
    }

    const normalizedEmail = email.toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Admin name is required for new admin user',
        });
      }

      // Create a placeholder admin user with random password; super admin will send initial password later
      const tempPassword = generateOTP() + generateOTP(); // 12 digits
      const hashed = await bcrypt.hash(tempPassword, 10);

      user = await User.create({
        name,
        email: normalizedEmail,
        mobile: `99999${Math.floor(10000 + Math.random() * 90000)}`, // placeholder, can be updated later
        password: hashed,
        role: 'admin',
        emailVerified: false,
        adminApprovalStatus: 'approved',
        isActive: true,
      });
    }

    const otpCode = generateOTP();
    const otpExpiry = getOtpExpiryDate();

    user.emailOTP = otpCode;
    user.emailOTPExpiresAt = otpExpiry;
    await user.save();

    await sendOTPEmail(
      user.email,
      user.name || 'Admin',
      otpCode,
      parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10)
    );

    return res.status(200).json({
      success: true,
      message: 'OTP sent to admin email for verification',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to send admin OTP');
  }
}



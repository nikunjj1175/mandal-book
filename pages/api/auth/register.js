const bcrypt = require('bcryptjs');
const connectDB = require('../../../lib/mongodb');
const User = require('../../../models/User');
const { handleApiError, generateOTP, getOtpExpiryDate } = require('../../../lib/utils');
const { sendOTPEmail } = require('../../../lib/email');
const applyCors = require('../../../lib/cors');

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { name, email, mobile, password, role } = req.body;

    // Validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields',
      });
    }

    // Check if user exists
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { mobile }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or mobile already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const otpCode = generateOTP();
    const otpExpiry = getOtpExpiryDate();

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      mobile,
      password: hashedPassword,
      role: role || 'member',
      emailOTP: otpCode,
      emailOTPExpiresAt: otpExpiry,
      emailVerified: false,
      adminApprovalStatus: 'pending',
    });

    await sendOTPEmail(user.email, user.name, otpCode, parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10));

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify the OTP sent to your email.',
      data: {
        requiresVerification: true,
        email: user.email,
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Registration failed');
  }
}


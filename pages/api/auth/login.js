const bcrypt = require('bcryptjs');
const connectDB = require('../../../lib/mongodb');
const User = require('../../../models/User');
const { generateToken, handleApiError } = require('../../../lib/utils');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email with the OTP sent to you.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          kycStatus: user.kycStatus,
          profilePic: user.profilePic,
          adminApprovalStatus: user.adminApprovalStatus,
          emailVerified: user.emailVerified,
        },
        token,
      },
      message:
        user.adminApprovalStatus === 'approved'
          ? 'Login successful'
          : 'Login successful. Waiting for admin approval.',
    });
  } catch (error) {
    return handleApiError(res, error, 'Login failed');
  }
}


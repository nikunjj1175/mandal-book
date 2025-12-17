const bcrypt = require('bcryptjs');
const connectDB = require('../../../lib/mongodb');
const User = require('../../../models/User');
const { handleApiError } = require('../../../lib/utils');
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
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email, OTP and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please try again.',
      });
    }

    if (user.resetPasswordOTPExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiresAt = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to reset password');
  }
}



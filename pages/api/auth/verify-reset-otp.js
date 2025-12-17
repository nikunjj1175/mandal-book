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
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required',
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

    return res.status(200).json({
      success: true,
      message: 'OTP verified. You can now reset your password.',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to verify reset OTP');
  }
}



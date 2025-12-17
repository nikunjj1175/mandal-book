const connectDB = require('../../../lib/mongodb');
const User = require('../../../models/User');
const { handleApiError, generateOTP, getOtpExpiryDate } = require('../../../lib/utils');
const { sendPasswordResetOTPEmail } = require('../../../lib/email');
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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // For security, don't reveal whether user exists or not.
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, an OTP has been sent.',
      });
    }

    const otpCode = generateOTP();
    const otpExpiry = getOtpExpiryDate();

    user.resetPasswordOTP = otpCode;
    user.resetPasswordOTPExpiresAt = otpExpiry;
    await user.save();

    await sendPasswordResetOTPEmail(
      user.email,
      user.name,
      otpCode,
      parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10)
    );

    return res.status(200).json({
      success: true,
      message: 'If this email is registered, an OTP has been sent.',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to initiate password reset');
  }
}



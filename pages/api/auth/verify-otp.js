const connectDB = require('../../../lib/mongodb');
const User = require('../../../models/User');
const Notification = require('../../../models/Notification');
const { handleApiError } = require('../../../lib/utils');
const { sendAdminApprovalEmail } = require('../../../lib/email');
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

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified. Waiting for admin approval.',
      });
    }

    if (!user.emailOTP || !user.emailOTPExpiresAt) {
      return res.status(400).json({
        success: false,
        error: 'OTP not generated. Please register again.',
      });
    }

    if (user.emailOTP !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please try again.',
      });
    }

    if (user.emailOTPExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please register again.',
      });
    }

    user.emailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpiresAt = undefined;
    await user.save();

    const admins = await User.find({ role: 'admin' });
    await Promise.all(
      admins.map(async (admin) => {
        await Notification.create({
          userId: admin._id,
          title: 'New User Awaiting Approval',
          description: `${user.name} (${user.email}) has verified their email and needs approval.`,
          type: 'system',
          relatedId: user._id,
        });

        await sendAdminApprovalEmail(admin.email, user.name, user.email);
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. Waiting for admin approval.',
      data: {
        emailVerified: true,
        adminApprovalStatus: user.adminApprovalStatus,
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to verify OTP');
  }
}



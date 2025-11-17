const connectDB = require('../../../../lib/mongodb');
const User = require('../../../../models/User');
const Notification = require('../../../../models/Notification');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const { sendKYCNotification } = require('../../../../lib/email');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireAdmin(req);

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { kycStatus: 'verified' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Create notification
    await Notification.create({
      userId: user._id,
      title: 'KYC Verified',
      description: 'Your KYC has been verified and approved by the admin',
      type: 'kyc',
      relatedId: user._id,
    });

    // Send email
    await sendKYCNotification(user.email, user.name, 'verified');

    res.status(200).json({
      success: true,
      data: { user },
      message: 'KYC approved successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to approve KYC');
  }
}

export default handler;


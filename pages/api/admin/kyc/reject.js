import applyCors from '@/lib/cors';
const User = require('../../../../models/User');
const Notification = require('../../../../models/Notification');
const { authenticate, requireAdminOrSuperAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const { sendKYCNotification } = require('../../../../lib/email');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireAdminOrSuperAdmin(req);

    const { userId, remarks } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { kycStatus: 'rejected', kycRemarks: remarks || '' },
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
      title: 'KYC Rejected',
      description: `Your KYC has been rejected. ${remarks ? `Remarks: ${remarks}` : ''}`,
      type: 'kyc',
      relatedId: user._id,
    });

    // Send email
    await sendKYCNotification(user.email, user.name, 'rejected');

    res.status(200).json({
      success: true,
      data: { user },
      message: 'KYC rejected',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to reject KYC');
  }
}

export default handler;


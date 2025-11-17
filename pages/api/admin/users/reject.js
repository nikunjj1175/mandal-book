const connectDB = require('../../../../lib/mongodb');
const User = require('../../../../models/User');
const Notification = require('../../../../models/Notification');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const { sendUserApprovalStatusEmail } = require('../../../../lib/email');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireAdmin(req);

    const { userId, remarks } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { adminApprovalStatus: 'rejected', adminApprovalRemarks: remarks || '' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    await Notification.create({
      userId: user._id,
      title: 'Account Rejected',
      description: `Your account request was rejected. ${remarks ? `Remarks: ${remarks}` : ''}`,
      type: 'system',
      relatedId: user._id,
    });

    if (user.email) {
      await sendUserApprovalStatusEmail(user.email, user.name, 'rejected', remarks);
    }

    res.status(200).json({
      success: true,
      data: { user },
      message: 'User rejected successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to reject user');
  }
}



import applyCors from '@/lib/cors';
const connectDB = require('../../../../lib/mongodb');
const User = require('../../../../models/User');
const Notification = require('../../../../models/Notification');
const { authenticate, requireAdminOrSuperAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const { sendUserApprovalStatusEmail } = require('../../../../lib/email');

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
    requireAdminOrSuperAdmin(req);

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { adminApprovalStatus: 'approved', adminApprovedAt: new Date(), adminApprovalRemarks: '' },
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
      title: 'Account Approved',
      description: 'Your account has been approved. You can now access all features.',
      type: 'system',
      relatedId: user._id,
    });

    if (user.email) {
      await sendUserApprovalStatusEmail(user.email, user.name, 'approved');
    }

    res.status(200).json({
      success: true,
      data: { user },
      message: 'User approved successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to approve user');
  }
}



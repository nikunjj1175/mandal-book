import applyCors from '@/lib/cors';
const User = require('../../../../models/User');
const Notification = require('../../../../models/Notification');
const { authenticate, requireAdminOrSuperAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');

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

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Only super admin can activate admin accounts; super_admin stays protected
    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify super admin activation from application',
      });
    }

    if (user.role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Only super admin can activate admin accounts',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isActive: true,
        deactivatedAt: null,
        deactivationReason: null,
      },
      { new: true }
    ).select('-password');

    // Create notification
    await Notification.create({
      userId: updatedUser._id,
      title: 'Account Activated',
      description: 'Your account has been activated by admin.',
      type: 'system',
    });

    res.status(200).json({
      success: true,
      data: { user: updatedUser },
      message: 'User activated successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to activate user');
  }
}

export default handler;


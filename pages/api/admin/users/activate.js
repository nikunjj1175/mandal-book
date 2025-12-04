import applyCors from '@/lib/cors';
const User = require('../../../../models/User');
const Notification = require('../../../../models/Notification');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
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
      {
        isActive: true,
        deactivatedAt: null,
        deactivationReason: null,
      },
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
      title: 'Account Activated',
      description: 'Your account has been activated by admin.',
      type: 'system',
    });

    res.status(200).json({
      success: true,
      data: { user },
      message: 'User activated successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to activate user');
  }
}

export default handler;


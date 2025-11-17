const Notification = require('../../models/Notification');
const { authenticate } = require('../../middleware/auth');
const { handleApiError } = require('../../lib/utils');

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await authenticate(req, res);

      const userId = req.user._id;
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false,
      });

      res.status(200).json({
        success: true,
        data: { notifications, unreadCount },
      });
    } catch (error) {
      return handleApiError(res, error, 'Failed to fetch notifications');
    }
  } else if (req.method === 'PUT') {
    try {
      await authenticate(req, res);

      const { notificationId } = req.body;

      if (notificationId) {
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      } else {
        // Mark all as read
        await Notification.updateMany(
          { userId: req.user._id },
          { isRead: true }
        );
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      return handleApiError(res, error, 'Failed to update notification');
    }
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

export default handler;


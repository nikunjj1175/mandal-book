import connectDB from '@/lib/mongodb';
import ChatTyping from '@/models/ChatTyping';
import { authenticate } from '@/middleware/auth';
import applyCors from '@/lib/cors';

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;

  try {
    await authenticate(req, res);
  } catch (err) {
    return res.status(err.statusCode || 401).json({
      success: false,
      error: err.message || 'Authentication required',
    });
  }

  const user = req.user;
  if (user.role !== 'admin' && (user.adminApprovalStatus !== 'approved' || user.isActive === false)) {
    return res.status(403).json({ success: false, error: 'You must be an approved member to use chat' });
  }

  await connectDB();

  if (req.method === 'POST') {
    const { mode = 'group', recipientId, isTyping } = req.body || {};

    if (!['group', 'personal'].includes(mode)) {
      return res.status(400).json({ success: false, error: 'Invalid mode' });
    }

    const filter = {
      userId: user._id,
      mode,
      recipientId: recipientId || null,
    };

    if (isTyping) {
      await ChatTyping.findOneAndUpdate(
        filter,
        { $set: { updatedAt: new Date() } },
        { upsert: true, new: true }
      );
    } else {
      await ChatTyping.deleteOne(filter);
    }

    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const { mode = 'group', with: withUser } = req.query || {};

    if (!['group', 'personal'].includes(mode)) {
      return res.status(400).json({ success: false, error: 'Invalid mode' });
    }

    let filter = { mode };

    if (mode === 'personal') {
      if (!withUser) {
        return res.status(400).json({ success: false, error: 'Recipient required' });
      }
      // For personal, we want to know if the other user is typing to me
      filter = {
        mode: 'personal',
        recipientId: user._id,
        userId: withUser,
      };
    } else {
      // Group: anyone (except me) typing in group
      filter = {
        mode: 'group',
        userId: { $ne: user._id },
      };
    }

    const entries = await ChatTyping.find(filter)
      .populate('userId', 'name')
      .lean();

    const typingUsers = entries.map((e) => ({
      id: e.userId?._id,
      name: e.userId?.name || 'Member',
    }));

    return res.status(200).json({ success: true, data: { typingUsers } });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}


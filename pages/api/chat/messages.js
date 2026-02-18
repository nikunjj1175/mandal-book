import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { authenticate } from '@/middleware/auth';
import applyCors from '@/lib/cors';

async function getMessages(req, res) {
  await connectDB();

  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const before = req.query.before;
  const mode = req.query.mode || 'group'; // 'group' | 'personal'
  const withUser = req.query.with; // userId for personal chat
  const currentUserId = req.user._id;

  let query = {};

  if (mode === 'personal' && withUser) {
    // Personal: messages where (userId=me, recipientId=them) OR (userId=them, recipientId=me)
    query = {
      $or: [
        { userId: currentUserId, recipientId: withUser },
        { userId: withUser, recipientId: currentUserId },
      ],
    };
  } else {
    // Group: recipientId is null or doesn't exist
    query.recipientId = { $in: [null, undefined] };
  }

  if (before) {
    const beforeDate = new Date(before);
    if (!isNaN(beforeDate.getTime())) {
      query.createdAt = { $lt: beforeDate };
    }
  }

  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name profilePic role')
    .lean();

  const sorted = messages.reverse();

  res.status(200).json({
    success: true,
    data: { messages: sorted, hasMore: messages.length === limit },
  });
}

async function postMessage(req, res) {
  await connectDB();

  const { message, recipientId } = req.body;
  const userId = req.user._id;
  const senderName = req.user.name;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return res.status(400).json({ success: false, error: 'Message cannot be empty' });
  }
  if (trimmed.length > 2000) {
    return res.status(400).json({ success: false, error: 'Message too long (max 2000 characters)' });
  }

  const isPersonal = recipientId && String(recipientId) !== String(userId);
  const finalRecipientId = isPersonal ? recipientId : null;

  const chatMsg = await ChatMessage.create({
    userId,
    recipientId: finalRecipientId || undefined,
    message: trimmed,
  });

  const populated = await ChatMessage.findById(chatMsg._id)
    .populate('userId', 'name profilePic role')
    .lean();

  // Create notifications for recipients
  if (isPersonal && recipientId) {
    await Notification.create({
      userId: recipientId,
      title: `New message from ${senderName}`,
      description: trimmed.length > 80 ? trimmed.slice(0, 80) + '...' : trimmed,
      type: 'chat',
      relatedId: chatMsg._id,
    });
  } else {
    // Group: notify all other members (except sender)
    const members = await User.find({
      _id: { $ne: userId },
      adminApprovalStatus: 'approved',
      isActive: { $ne: false },
    }).select('_id');
    for (const m of members) {
      await Notification.create({
        userId: m._id,
        title: `${senderName} (Group Chat)`,
        description: trimmed.length > 80 ? trimmed.slice(0, 80) + '...' : trimmed,
        type: 'chat',
        relatedId: chatMsg._id,
      });
    }
  }

  res.status(201).json({ success: true, data: { message: populated } });
}

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
    return res.status(403).json({
      success: false,
      error: 'You must be an approved member to use chat',
    });
  }

  if (req.method === 'GET') return getMessages(req, res);
  if (req.method === 'POST') return postMessage(req, res);
  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

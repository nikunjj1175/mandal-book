import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import { authenticate } from '@/middleware/auth';
import applyCors from '@/lib/cors';
import { pusherServer } from '@/lib/pusher';

async function getMessages(req, res) {
  await connectDB();

  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const before = req.query.before;
  const mode = req.query.mode || 'group'; // 'group' | 'personal'
  const withUser = req.query.with; // userId for personal chat
  const currentUserId = req.user._id;

  let query = {};

  if (mode === 'personal' && withUser) {
    query = {
      $or: [
        { userId: currentUserId, recipientId: withUser },
        { userId: withUser, recipientId: currentUserId },
      ],
    };
  } else {
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

  const payload = {
    _id: populated._id,
    message: populated.message,
    createdAt: populated.createdAt,
    editedAt: populated.editedAt || null,
    userId: {
      _id: populated.userId._id,
      name: populated.userId.name,
      role: populated.userId.role,
      profilePic: populated.userId.profilePic || null,
    },
    recipientId: populated.recipientId || null,
  };

  if (isPersonal) {
    const room = `chat-${[String(userId), String(recipientId)].sort().join('-')}`;
    await pusherServer.trigger(room, 'chat:message', payload);
  } else {
    await pusherServer.trigger('mandal-group', 'chat:message', payload);
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
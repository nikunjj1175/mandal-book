import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
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

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Message ID required' });
  }

  await connectDB();

  const msg = await ChatMessage.findById(id);
  if (!msg) {
    return res.status(404).json({ success: false, error: 'Message not found' });
  }

  const isOwner = String(msg.userId) === String(user._id);
  if (!isOwner) {
    return res.status(403).json({ success: false, error: 'You can only edit or delete your own messages' });
  }

  if (req.method === 'PATCH') {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    const trimmed = message.trim();
    if (!trimmed) return res.status(400).json({ success: false, error: 'Message cannot be empty' });
    if (trimmed.length > 2000) return res.status(400).json({ success: false, error: 'Message too long' });

    msg.message = trimmed;
    msg.editedAt = new Date();
    await msg.save();

    const populated = await ChatMessage.findById(msg._id)
      .populate('userId', 'name profilePic role')
      .lean();

    return res.status(200).json({ success: true, data: { message: populated } });
  }

  if (req.method === 'DELETE') {
    await ChatMessage.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Message deleted' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

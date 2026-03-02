import { authenticate } from '@/middleware/auth';
import applyCors from '@/lib/cors';
import { pusherServer } from '@/lib/pusher';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { mode = 'group', recipientId, isTyping } = req.body || {};
  if (!['group', 'personal'].includes(mode)) {
    return res.status(400).json({ success: false, error: 'Invalid mode' });
  }

  const basePayload = {
    userId: user._id,
    name: user.name,
    isTyping: !!isTyping,
  };

  if (mode === 'personal' && recipientId) {
    const room = `chat-${[String(user._id), String(recipientId)].sort().join('-')}`;
    await pusherServer.trigger(room, 'chat:typing', { ...basePayload, mode: 'personal', recipientId });
  } else {
    await pusherServer.trigger('mandal-group', 'chat:typing', {
      ...basePayload,
      mode: 'group',
    });
  }

  return res.status(200).json({ success: true });
}
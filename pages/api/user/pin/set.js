import applyCors from '@/lib/cors';
const bcrypt = require('bcryptjs');
const User = require('../../../../models/User');
const { authenticate } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');

function isValidPin(pin) {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    const { pin, confirmPin } = req.body;

    if (!isValidPin(pin) || !isValidPin(confirmPin)) {
      return res.status(400).json({ success: false, error: 'PIN must be exactly 4 digits' });
    }
    if (pin !== confirmPin) {
      return res.status(400).json({ success: false, error: 'PIN and confirm PIN do not match' });
    }

    const hashed = await bcrypt.hash(pin, 10);
    const now = new Date();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        pinHash: hashed,
        pinSetAt: req.user.pinSetAt || now,
        pinUpdatedAt: now,
      },
      { new: true }
    ).select('-password -pinHash');

    return res.status(200).json({
      success: true,
      data: { hasPin: Boolean(user?.pinSetAt) },
      message: 'PIN set successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to set PIN');
  }
}

export default handler;


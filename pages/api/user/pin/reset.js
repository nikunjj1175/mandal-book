import applyCors from '@/lib/cors';
const bcrypt = require('bcryptjs');
const connectDB = require('../../../../lib/mongodb');
const User = require('../../../../models/User');
const { authenticate } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');

function isValidPin(pin) {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

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

    const { password, newPin, confirmNewPin } = req.body;
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }
    if (!isValidPin(newPin) || !isValidPin(confirmNewPin)) {
      return res.status(400).json({ success: false, error: 'New PIN must be exactly 4 digits' });
    }
    if (newPin !== confirmNewPin) {
      return res.status(400).json({ success: false, error: 'New PIN and confirm PIN do not match' });
    }

    // authenticate() loads user without password, so fetch full user for password verification
    const fullUser = await User.findById(req.user._id);
    if (!fullUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, fullUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    const hashed = await bcrypt.hash(newPin, 10);
    const now = new Date();
    fullUser.pinHash = hashed;
    fullUser.pinSetAt = fullUser.pinSetAt || now;
    fullUser.pinUpdatedAt = now;
    await fullUser.save();

    return res.status(200).json({ success: true, message: 'PIN reset successfully' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to reset PIN');
  }
}


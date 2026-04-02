import applyCors from '@/lib/cors';
const bcrypt = require('bcryptjs');
const connectDB = require('../../../../lib/mongodb');
const User = require('../../../../models/User');
const PinVerificationLog = require('../../../../models/PinVerificationLog');
const { authenticate } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');

function isValidPin(pin) {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

function getClientIp(req) {
  if (req.headers['x-vercel-forwarded-for']) {
    return req.headers['x-vercel-forwarded-for'].split(',')[0].trim();
  }
  if (req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for'].split(',')[0].trim();
  }
  if (req.headers['x-real-ip']) return req.headers['x-real-ip'];
  if (req.socket?.remoteAddress) return req.socket.remoteAddress;
  return 'Unknown';
}

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await authenticate(req, res);

    const { pin } = req.body;
    if (!isValidPin(pin)) {
      return res.status(400).json({ success: false, error: 'PIN must be exactly 4 digits' });
    }

    const fullUser = await User.findById(req.user._id);
    if (!fullUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!fullUser.pinHash) {
      return res.status(400).json({ success: false, error: 'PIN not set. Please set your PIN first.' });
    }

    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const ok = await bcrypt.compare(pin, fullUser.pinHash);

    await PinVerificationLog.create({
      userId: fullUser._id,
      email: fullUser.email,
      success: ok,
      ipAddress,
      userAgent,
      attemptedAt: new Date(),
    });

    if (!ok) {
      return res.status(401).json({ success: false, error: 'Wrong PIN' });
    }

    return res.status(200).json({
      success: true,
      message: 'PIN verified',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to verify PIN');
  }
}

export default handler;

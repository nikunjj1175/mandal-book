const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);

function generateToken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function getTokenFromRequest(req) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  } catch (error) {
    return null;
  }
}

function maskAadhaar(aadhaar) {
  if (!aadhaar || aadhaar.length < 4) return '****';
  return `****-****-${aadhaar.slice(-4)}`;
}

function maskPAN(pan) {
  if (!pan || pan.length < 4) return '****';
  return `****${pan.slice(-4)}`;
}

function maskAccountNumber(account) {
  if (!account || account.length < 4) return '****';
  return `****${account.slice(-4)}`;
}

function handleApiError(res, error, defaultMessage = 'An error occurred') {
  console.error('API Error:', error);
  const statusCode = error.statusCode || 500;
  const message = error.message || defaultMessage;
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpExpiryDate() {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

module.exports = {
  generateToken,
  verifyToken,
  getTokenFromRequest,
  maskAadhaar,
  maskPAN,
  maskAccountNumber,
  handleApiError,
  generateOTP,
  getOtpExpiryDate,
};


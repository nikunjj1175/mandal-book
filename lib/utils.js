const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES, 10);

// Token expiry from env (default: 15 minutes for access, 7 days for refresh)
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS, 10);

function generateAccessToken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  } catch (error) {
    console.error('Access token generation error:', error);
    throw new Error('Failed to generate access token');
  }
}

function generateRefreshToken(payload) {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` });
  } catch (error) {
    console.error('Refresh token generation error:', error);
    throw new Error('Failed to generate refresh token');
  }
}

// Generate random refresh token string (for database storage)
function generateRefreshTokenString() {
  return crypto.randomBytes(40).toString('hex');
}

// Legacy function for backward compatibility
function generateToken(payload) {
  return generateAccessToken(payload);
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

// Legacy function for backward compatibility
function verifyToken(token) {
  return verifyAccessToken(token);
}

function getRefreshTokenExpiry() {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
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

/**
 * Calculate loan interest amount (Simple Interest)
 * @param {number} principal - Loan principal amount
 * @param {number} rate - Interest rate percentage
 * @param {number} duration - Duration in months
 * @returns {number} Interest amount
 */
function calculateLoanInterest(principal, rate, duration) {
  if (!principal || !rate || !duration) return 0;
  // Simple Interest: (Principal × Rate × Time) / (100 × 12)
  // Time is in months, so we divide by 12 to convert to years
  return (principal * rate * duration) / (100 * 12);
}

/**
 * Calculate total payable amount (Principal + Interest)
 * @param {number} principal - Loan principal amount
 * @param {number} rate - Interest rate percentage
 * @param {number} duration - Duration in months
 * @returns {number} Total payable amount
 */
function calculateTotalPayable(principal, rate, duration) {
  const interest = calculateLoanInterest(principal, rate, duration);
  return principal + interest;
}

module.exports = {
  generateToken, // Legacy - use generateAccessToken
  generateAccessToken,
  generateRefreshToken,
  generateRefreshTokenString,
  verifyToken, // Legacy - use verifyAccessToken
  verifyAccessToken,
  verifyRefreshToken,
  getTokenFromRequest,
  getRefreshTokenExpiry,
  maskAadhaar,
  maskPAN,
  maskAccountNumber,
  handleApiError,
  generateOTP,
  getOtpExpiryDate,
  calculateLoanInterest,
  calculateTotalPayable,
};


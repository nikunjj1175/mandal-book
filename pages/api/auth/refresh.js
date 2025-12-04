const connectDB = require('../../../lib/mongodb');
const User = require('../../../models/User');
const RefreshToken = require('../../../models/RefreshToken');
const { generateAccessToken, verifyRefreshToken, handleApiError } = require('../../../lib/utils');
const applyCors = require('../../../lib/cors');

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // Find refresh token in database
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      revoked: false,
    }).populate('userId');

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or revoked refresh token',
      });
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      // Mark as revoked
      await RefreshToken.findByIdAndUpdate(storedToken._id, {
        revoked: true,
        revokedAt: new Date(),
      });
      return res.status(401).json({
        success: false,
        error: 'Refresh token has expired',
      });
    }

    // Get user
    const user = await User.findById(storedToken.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact admin.',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        token: accessToken,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to refresh token');
  }
}


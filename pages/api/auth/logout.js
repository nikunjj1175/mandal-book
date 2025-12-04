const connectDB = require('../../../lib/mongodb');
const RefreshToken = require('../../../models/RefreshToken');
const { handleApiError } = require('../../../lib/utils');
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

    if (refreshToken) {
      // Revoke refresh token
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        {
          revoked: true,
          revokedAt: new Date(),
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Logout failed');
  }
}


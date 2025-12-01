const connectDB = require('../../../lib/mongodb');
const LoginHistory = require('../../../models/LoginHistory');
const User = require('../../../models/User');
const { verifyToken, getTokenFromRequest, handleApiError } = require('../../../lib/utils');
const applyCors = require('../../../lib/cors');

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Authenticate user
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Build query - admin sees all, users see only their own
    const query = {};
    if (user.role !== 'admin') {
      query.userId = user._id;
    }

    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Optional: Filter by userId (for admin viewing specific user)
    if (user.role === 'admin' && req.query.userId) {
      query.userId = req.query.userId;
    }

    // Fetch login history with user details
    const [loginHistory, totalCount] = await Promise.all([
      LoginHistory.find(query)
        .populate('userId', 'name email')
        .sort({ loginAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LoginHistory.countDocuments(query),
    ]);

    // Format response
    const formattedHistory = loginHistory.map((record) => ({
      _id: record._id,
      userId: record.userId?._id || record.userId,
      userName: record.userId?.name || 'Unknown',
      userEmail: record.userId?.email || record.email,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      loginAt: record.loginAt,
      createdAt: record.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        history: formattedHistory,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch login history');
  }
}


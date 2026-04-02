const mongoose = require('mongoose');
const connectDB = require('../../../lib/mongodb');
const PinVerificationLog = require('../../../models/PinVerificationLog');
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

    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const query = {};
    if (user.role !== 'admin') {
      query.userId = user._id;
    }
    if (user.role === 'admin' && req.query.userId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
        return res.status(400).json({ success: false, error: 'Invalid userId' });
      }
      query.userId = req.query.userId;
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      PinVerificationLog.find(query)
        .populate('userId', 'name email')
        .sort({ attemptedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PinVerificationLog.countDocuments(query),
    ]);

    const history = logs.map((r) => ({
      _id: r._id,
      userId: r.userId?._id || r.userId,
      userName: r.userId?.name || 'Unknown',
      userEmail: r.userId?.email || r.email,
      success: r.success,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      attemptedAt: r.attemptedAt,
      createdAt: r.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        history,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch PIN history');
  }
}

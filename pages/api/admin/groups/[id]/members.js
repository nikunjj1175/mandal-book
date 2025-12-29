import applyCors from '@/lib/cors';
const connectDB = require('../../../../../lib/mongodb');
const User = require('../../../../../models/User');
const { authenticate, requireSuperAdmin } = require('../../../../../middleware/auth');
const { handleApiError } = require('../../../../../lib/utils');

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  const {
    query: { id },
    method,
  } = req;

  if (method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!id) {
    return res.status(400).json({ success: false, error: 'Group ID is required' });
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireSuperAdmin(req);

    const members = await User.find({
      role: 'member',
      groupId: id,
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: { members },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch group members');
  }
}



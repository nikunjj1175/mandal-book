import applyCors from '@/lib/cors';
const User = require('../../../../models/User');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireAdmin(req);

    const users = await User.find({
      kycStatus: { $in: ['pending', 'under_review'] },
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch pending KYC');
  }
}

export default handler;


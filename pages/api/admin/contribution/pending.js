import applyCors from '@/lib/cors';
const Contribution = require('../../../../models/Contribution');
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

    const contributions = await Contribution.find({ status: 'pending' })
      .populate('userId', 'name email mobile profilePic')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { contributions },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch pending contributions');
  }
}

export default handler;


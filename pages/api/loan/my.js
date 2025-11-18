import applyCors from '@/lib/cors';
const Loan = require('../../../models/Loan');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireApprovedMember(req);

    const userId = req.user._id;

    const loans = await Loan.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { loans },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch loans');
  }
}

export default handler;


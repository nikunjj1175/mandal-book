const Contribution = require('../../../models/Contribution');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireApprovedMember(req);

    const userId = req.user._id;
    const contributions = await Contribution.find({ userId })
      .sort({ month: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { contributions },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch contributions');
  }
}

export default handler;


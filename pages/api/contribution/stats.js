import applyCors from '@/lib/cors';
const Contribution = require('../../../models/Contribution');
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
    // Allow admins and only approved members
    if (req.user.role !== 'admin') {
      requireApprovedMember(req);
    }

    const [totalContributions, totalAmountAgg, monthlyAgg] = await Promise.all([
      Contribution.countDocuments({}),
      Contribution.aggregate([
        { $match: { status: 'done' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Contribution.aggregate([
        { $match: { status: 'done' } },
        {
          $group: {
            _id: '$month',
            totalAmount: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalAmount = totalAmountAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        totalContributions,
        totalAmount,
        monthlyTotals: monthlyAgg.map((item) => ({
          month: item._id,
          total: item.totalAmount,
        })),
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch contribution stats');
  }
}

export default handler;


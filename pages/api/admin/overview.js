import applyCors from '@/lib/cors';
const connectDB = require('../../../lib/mongodb');
const User = require('../../../models/User');
const Contribution = require('../../../models/Contribution');
const { authenticate, requireAdmin } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireAdmin(req);

    const [totalMembers, pendingApprovals, pendingKYC, totalFund, totalContributionsCount, monthlyData] = await Promise.all([
      User.countDocuments({ role: 'member' }),
      User.countDocuments({ role: 'member', emailVerified: true, adminApprovalStatus: 'pending' }),
      User.countDocuments({ kycStatus: { $in: ['pending', 'under_review'] } }),
      Contribution.aggregate([
        { $match: { status: 'done' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
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
      Contribution.countDocuments({}),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalMembers,
          pendingApprovals,
          pendingKYC,
          totalFund: totalFund[0]?.total || 0,
          totalContributionsCount,
        },
        contributionsByMonth: monthlyData.map((item) => ({
          month: item._id,
          total: item.totalAmount,
        })),
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch overview');
  }
}



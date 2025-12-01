import applyCors from '@/lib/cors';
const mongoose = require('mongoose');
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
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      requireApprovedMember(req);
    }

    const { memberId = 'all' } = req.query;
    // Normalize IDs to strings for comparison
    const memberIdStr = String(memberId);
    const userIdStr = String(req.user._id || '');
    const requestingOwnData = memberIdStr === userIdStr;

    // Allow all approved members (admin and normal) to view any member's contribution stats
    // This enables chart filtering for transparency - showing aggregated contribution data only
    // This is read-only aggregated data, safe for transparency
    // No sensitive personal information is exposed, just contribution totals by month

    // For charts, include all non-rejected contributions so trends are visible
    let memberFilter = { status: { $ne: 'rejected' } };
    if (memberId && memberId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ success: false, error: 'Invalid memberId' });
      }
      memberFilter.userId = new mongoose.Types.ObjectId(memberId);
    }

    const baseFilter = { status: { $ne: 'rejected' } };

    const [totalContributions, totalAmountAgg, monthlyAgg, memberAgg] = await Promise.all([
      Contribution.countDocuments(baseFilter),
      Contribution.aggregate([
        { $match: baseFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Contribution.aggregate([
        { $match: memberFilter },
        {
          $group: {
            _id: '$month',
            totalAmount: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Contribution.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: '$userId',
            totalAmount: { $sum: '$amount' },
            contributions: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            name: '$user.name',
            totalAmount: 1,
            contributions: 1,
          },
        },
        { $sort: { name: 1 } },
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
        memberOptions: memberAgg.map((member) => ({
          id: member._id,
          name: member.name,
          totalAmount: member.totalAmount,
          contributions: member.contributions,
        })),
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch contribution stats');
  }
}

export default handler;


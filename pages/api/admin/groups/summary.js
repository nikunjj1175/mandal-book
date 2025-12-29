import applyCors from '@/lib/cors';
const connectDB = require('../../../../lib/mongodb');
const User = require('../../../../models/User');
const Contribution = require('../../../../models/Contribution');
const Loan = require('../../../../models/Loan');
const Group = require('../../../../models/Group');
const { authenticate, requireAdminOrSuperAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');

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
    requireAdminOrSuperAdmin(req);

    // Members per group
    const memberAgg = await User.aggregate([
      { $match: { role: 'member' } },
      {
        $group: {
          _id: '$groupId',
          memberCount: { $sum: 1 },
        },
      },
    ]);

    // Contributions (done) per group via user lookup
    const contributionAgg = await Contribution.aggregate([
      { $match: { status: 'done' } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.groupId',
          totalFund: { $sum: '$amount' },
          contributionCount: { $sum: 1 },
        },
      },
    ]);

    // Loans per group via user lookup
    const loanAgg = await Loan.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.groupId',
          loanCount: { $sum: 1 },
        },
      },
    ]);

    // Collect all group IDs (including null/default)
    const groupIdsSet = new Set();
    memberAgg.forEach((m) => groupIdsSet.add(String(m._id)));
    contributionAgg.forEach((c) => groupIdsSet.add(String(c._id)));
    loanAgg.forEach((l) => groupIdsSet.add(String(l._id)));

    const groupIds = Array.from(groupIdsSet).filter((id) => id !== 'null' && id !== 'undefined');

    const groups = groupIds.length
      ? await Group.find({ _id: { $in: groupIds } }).lean()
      : [];

    const groupMap = new Map();
    groups.forEach((g) => {
      groupMap.set(String(g._id), g);
    });

    const byGroup = {};

    memberAgg.forEach((m) => {
      const key = String(m._id);
      if (!byGroup[key]) byGroup[key] = {};
      byGroup[key].memberCount = m.memberCount;
    });

    contributionAgg.forEach((c) => {
      const key = String(c._id);
      if (!byGroup[key]) byGroup[key] = {};
      byGroup[key].totalFund = c.totalFund;
      byGroup[key].contributionCount = c.contributionCount;
    });

    loanAgg.forEach((l) => {
      const key = String(l._id);
      if (!byGroup[key]) byGroup[key] = {};
      byGroup[key].loanCount = l.loanCount;
    });

    const result = Object.entries(byGroup).map(([key, stats]) => {
      const group = key !== 'null' && key !== 'undefined' ? groupMap.get(key) : null;
      return {
        groupId: key !== 'null' && key !== 'undefined' ? key : null,
        name: group?.name || (key === 'null' || key === 'undefined' ? 'Default Group' : 'Unknown Group'),
        code: group?.code || null,
        memberCount: stats.memberCount || 0,
        totalFund: stats.totalFund || 0,
        contributionCount: stats.contributionCount || 0,
        loanCount: stats.loanCount || 0,
      };
    });

    // Sort by name for nicer UI
    result.sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch group summary');
  }
}



import applyCors from '@/lib/cors';
const mongoose = require('mongoose');
const Contribution = require('../../../models/Contribution');
const User = require('../../../models/User');
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

    // Get all approved contributions
    const contributions = await Contribution.find({ status: { $ne: 'rejected' } })
      .populate('userId', 'name email mobile')
      .sort({ month: 1, createdAt: 1 });

    // Get all members who have contributed
    const members = await User.find({
      adminApprovalStatus: 'approved',
    })
      .select('name email mobile')
      .sort({ name: 1 });

    // Organize data: member-wise and month-wise
    const memberWiseData = {};
    const monthWiseData = {};
    let grandTotal = 0;

    contributions.forEach((contrib) => {
      const memberId = contrib.userId?._id?.toString() || 'unknown';
      const memberName = contrib.userId?.name || 'Unknown';
      const month = contrib.month || 'N/A';

      // Member-wise aggregation
      if (!memberWiseData[memberId]) {
        memberWiseData[memberId] = {
          id: memberId,
          name: memberName,
          email: contrib.userId?.email || '',
          mobile: contrib.userId?.mobile || '',
          months: {},
          total: 0,
          count: 0,
        };
      }

      if (!memberWiseData[memberId].months[month]) {
        memberWiseData[memberId].months[month] = 0;
      }
      memberWiseData[memberId].months[month] += contrib.amount;
      memberWiseData[memberId].total += contrib.amount;
      memberWiseData[memberId].count += 1;

      // Month-wise aggregation
      if (!monthWiseData[month]) {
        monthWiseData[month] = {
          month,
          members: {},
          total: 0,
        };
      }

      if (!monthWiseData[month].members[memberId]) {
        monthWiseData[month].members[memberId] = {
          name: memberName,
          amount: 0,
        };
      }
      monthWiseData[month].members[memberId].amount += contrib.amount;
      monthWiseData[month].total += contrib.amount;

      grandTotal += contrib.amount;
    });

    // Convert to arrays for easier handling
    const memberWiseArray = Object.values(memberWiseData).sort((a, b) => a.name.localeCompare(b.name));
    const monthWiseArray = Object.values(monthWiseData).sort((a, b) => a.month.localeCompare(b.month));

    // Get all unique months
    const allMonths = [...new Set(monthWiseArray.map((m) => m.month))].sort();

    res.status(200).json({
      success: true,
      data: {
        grandTotal,
        totalContributions: contributions.length,
        totalMembers: memberWiseArray.length,
        memberWise: memberWiseArray,
        monthWise: monthWiseArray,
        allMonths,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to export contribution data');
  }
}

export default handler;


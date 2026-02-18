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

    // Get current year and last year
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    // Organize data: member-wise and month-wise, separated by year
    const memberWiseData = {};
    const currentYearMonthWiseData = {};
    const lastYearMonthWiseData = {};
    let currentYearTotal = 0;
    let lastYearTotal = 0;
    let grandTotal = 0;

    contributions.forEach((contrib) => {
      const memberId = contrib.userId?._id?.toString() || 'unknown';
      const memberName = contrib.userId?.name || 'Unknown';
      const month = contrib.month || 'N/A';

      // Parse year from month string (format: "YYYY-MM" or "Month YYYY")
      let year = currentYear;
      if (month.includes('-')) {
        year = parseInt(month.split('-')[0]);
      } else if (month.match(/\d{4}/)) {
        year = parseInt(month.match(/\d{4}/)[0]);
      }

      const isCurrentYear = year === currentYear;
      const isLastYear = year === lastYear;

      // Member-wise aggregation (all years)
      if (!memberWiseData[memberId]) {
        memberWiseData[memberId] = {
          id: memberId,
          name: memberName,
          email: contrib.userId?.email || '',
          mobile: contrib.userId?.mobile || '',
          currentYearMonths: {},
          lastYearTotal: 0,
          currentYearTotal: 0,
          total: 0,
          count: 0,
        };
      }

      if (isCurrentYear) {
        if (!memberWiseData[memberId].currentYearMonths[month]) {
          memberWiseData[memberId].currentYearMonths[month] = 0;
        }
        memberWiseData[memberId].currentYearMonths[month] += contrib.amount;
        memberWiseData[memberId].currentYearTotal += contrib.amount;
        currentYearTotal += contrib.amount;
      } else if (isLastYear) {
        memberWiseData[memberId].lastYearTotal += contrib.amount;
        lastYearTotal += contrib.amount;
      }

      memberWiseData[memberId].total += contrib.amount;
      memberWiseData[memberId].count += 1;

      // Current year month-wise aggregation
      if (isCurrentYear) {
        if (!currentYearMonthWiseData[month]) {
          currentYearMonthWiseData[month] = {
            month,
            members: {},
            total: 0,
          };
        }

        if (!currentYearMonthWiseData[month].members[memberId]) {
          currentYearMonthWiseData[month].members[memberId] = {
            name: memberName,
            amount: 0,
          };
        }
        currentYearMonthWiseData[month].members[memberId].amount += contrib.amount;
        currentYearMonthWiseData[month].total += contrib.amount;
      }

      grandTotal += contrib.amount;
    });

    // Convert to arrays for easier handling
    const memberWiseArray = Object.values(memberWiseData).sort((a, b) => a.name.localeCompare(b.name));
    const currentYearMonthWiseArray = Object.values(currentYearMonthWiseData).sort((a, b) => a.month.localeCompare(b.month));

    // Get all unique months for current year only
    const currentYearMonths = [...new Set(currentYearMonthWiseArray.map((m) => m.month))].sort();

    res.status(200).json({
      success: true,
      data: {
        grandTotal,
        currentYearTotal,
        lastYearTotal,
        currentYear,
        lastYear,
        totalContributions: contributions.length,
        totalMembers: memberWiseArray.length,
        memberWise: memberWiseArray,
        currentYearMonthWise: currentYearMonthWiseArray,
        currentYearMonths,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to export contribution data');
  }
}

export default handler;


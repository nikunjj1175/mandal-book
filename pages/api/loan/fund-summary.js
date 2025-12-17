import applyCors from '@/lib/cors';
const Contribution = require('../../../models/Contribution');
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
    // Member-only view, but same approval/KYC rules
    requireApprovedMember(req);

    const [totalFundAgg, activeLoansAgg] = await Promise.all([
      Contribution.aggregate([
        { $match: { status: 'done' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      Loan.aggregate([
        { $match: { status: { $in: ['approved', 'active'] } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const totalFund = totalFundAgg[0]?.total || 0;
    const totalLoanOut = activeLoansAgg[0]?.total || 0;
    const availableFund = Math.max(0, totalFund - totalLoanOut);

    return res.status(200).json({
      success: true,
      data: {
        totalFund,
        totalLoanOut,
        availableFund,
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch loan fund summary');
  }
}

export default handler;



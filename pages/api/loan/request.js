import applyCors from '@/lib/cors';
const Loan = require('../../../models/Loan');
const Contribution = require('../../../models/Contribution');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError, decryptRequestDates } = require('../../../lib/utils');
const Notification = require('../../../models/Notification');
const User = require('../../../models/User');
const { sendAdminNotification } = require('../../../lib/email');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireApprovedMember(req);

    // Decrypt dates in request body
    decryptRequestDates(req);

    const userId = req.user._id;
    const { amount, reason, duration, startDate, endDate } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Please provide amount and reason',
      });
    }

    const requestedAmount = parseFloat(amount);

    if (Number.isNaN(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid loan amount',
      });
    }

    // Calculate available mandal fund:
    // total approved contributions minus total approved/active loan principal
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

    if (requestedAmount > availableFund) {
      return res.status(400).json({
        success: false,
        error: `Loan amount cannot exceed available mandal fund. Available: ₹${availableFund.toLocaleString(
          'en-IN'
        )}`,
      });
    }

    const loan = await Loan.create({
      userId,
      amount: requestedAmount,
      pendingAmount: requestedAmount,
      duration: duration || 12,
      reason,
      status: 'pending',
    });

    // Create notification for admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await Notification.create({
        userId: admin._id,
        title: 'New Loan Request',
        description: `${req.user.name} has requested a loan of ₹${amount}`,
        type: 'loan',
        relatedId: loan._id,
      });

      await sendAdminNotification(
        admin.email,
        'New Loan Request',
        `${req.user.name} has requested a loan of ₹${amount}`
      );
    }

    res.status(201).json({
      success: true,
      data: { loan },
      message: 'Loan request submitted successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to submit loan request');
  }
}

export default handler;


import applyCors from '@/lib/cors';
const Loan = require('../../../../models/Loan');
const Notification = require('../../../../models/Notification');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
const { handleApiError, calculateLoanInterest, calculateTotalPayable } = require('../../../../lib/utils');
const { sendLoanNotification } = require('../../../../lib/email');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireAdmin(req);

    const { loanId, interestRate } = req.body;

    if (!loanId) {
      return res.status(400).json({
        success: false,
        error: 'Loan ID is required',
      });
    }

    const existingLoan = await Loan.findById(loanId);
    if (!existingLoan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found',
      });
    }

    const interestRateValue = parseFloat(interestRate) || 0;
    const principalAmount = parseFloat(existingLoan.amount);
    const durationMonths = parseFloat(existingLoan.duration) || 12;
    
    // Calculate interest amount using utility function
    const interestAmount = calculateLoanInterest(principalAmount, interestRateValue, durationMonths);
    const totalPayable = calculateTotalPayable(principalAmount, interestRateValue, durationMonths);

    const loan = await Loan.findByIdAndUpdate(
      loanId,
      {
        status: 'active',
        interestRate: interestRateValue,
        interestAmount: Math.round(interestAmount * 100) / 100, // Round to 2 decimal places
        totalPayable: Math.round(totalPayable * 100) / 100, // Round to 2 decimal places
        pendingAmount: Math.round(totalPayable * 100) / 100, // Update pending amount to include interest (rounded)
      },
      { new: true }
    ).populate('userId');


    // Create notification
    await Notification.create({
      userId: loan.userId._id,
      title: 'Loan Approved',
      description: `Your loan request of ₹${loan.amount} has been approved${interestRate ? ` with ${interestRate}% interest rate` : ''}`,
      type: 'loan',
      relatedId: loan._id,
    });

    // Send email
    await sendLoanNotification(loan.userId.email, loan.userId.name, 'approved');

    res.status(200).json({
      success: true,
      data: { loan },
      message: 'Loan approved successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to approve loan');
  }
}

export default handler;


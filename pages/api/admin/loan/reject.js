const Loan = require('../../../../models/Loan');
const Notification = require('../../../../models/Notification');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const { sendLoanNotification } = require('../../../../lib/email');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireAdmin(req);

    const { loanId, remarks } = req.body;

    if (!loanId) {
      return res.status(400).json({
        success: false,
        error: 'Loan ID is required',
      });
    }

    const loan = await Loan.findByIdAndUpdate(
      loanId,
      {
        status: 'rejected',
        adminRemarks: remarks || '',
      },
      { new: true }
    ).populate('userId');

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found',
      });
    }

    // Create notification
    await Notification.create({
      userId: loan.userId._id,
      title: 'Loan Rejected',
      description: `Your loan request has been rejected. ${remarks ? `Remarks: ${remarks}` : ''}`,
      type: 'loan',
      relatedId: loan._id,
    });

    // Send email
    await sendLoanNotification(loan.userId.email, loan.userId.name, 'rejected');

    res.status(200).json({
      success: true,
      data: { loan },
      message: 'Loan rejected',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to reject loan');
  }
}

export default handler;


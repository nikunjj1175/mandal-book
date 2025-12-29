import applyCors from '@/lib/cors';
const Loan = require('../../../../models/Loan');
const Notification = require('../../../../models/Notification');
const { authenticate, requireAdminOrSuperAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const User = require('../../../../models/User');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireAdminOrSuperAdmin(req);

    const { loanId, installmentIndex, reason } = req.body;

    if (!loanId || installmentIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Loan ID and installment index are required',
      });
    }

    const loan = await Loan.findById(loanId).populate('userId');
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found',
      });
    }

    if (!loan.installmentsPaid || loan.installmentsPaid.length <= installmentIndex) {
      return res.status(400).json({
        success: false,
        error: 'Invalid installment index',
      });
    }

    // Update installment status
    loan.installmentsPaid[installmentIndex].status = 'rejected';
    if (reason) {
      loan.installmentsPaid[installmentIndex].rejectionReason = reason;
    }
    await loan.save();

    // Recalculate pending amount based on approved installments only
    const approvedPayments = loan.installmentsPaid
      .filter(inst => inst.status === 'approved')
      .reduce((sum, inst) => sum + (inst.amount || 0), 0);
    
    const totalPayable = loan.totalPayable || loan.amount;
    const newPendingAmount = Math.max(0, Math.round((totalPayable - approvedPayments) * 100) / 100);
    
    loan.pendingAmount = newPendingAmount;
    await loan.save();

    // Create notification
    await Notification.create({
      userId: loan.userId._id,
      title: 'Loan Payment Rejected',
      description: `Your loan payment of ₹${loan.installmentsPaid[installmentIndex].amount} has been rejected${reason ? `: ${reason}` : ''}`,
      type: 'loan',
      relatedId: loan._id,
    });

    res.status(200).json({
      success: true,
      data: { loan },
      message: 'Installment rejected',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to reject installment');
  }
}

export default handler;


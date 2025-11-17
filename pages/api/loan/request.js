const Loan = require('../../../models/Loan');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');
const Notification = require('../../../models/Notification');
const User = require('../../../models/User');
const { sendAdminNotification } = require('../../../lib/email');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireApprovedMember(req);

    const userId = req.user._id;
    const { amount, reason, duration } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Please provide amount and reason',
      });
    }

    const loan = await Loan.create({
      userId,
      amount: parseFloat(amount),
      pendingAmount: parseFloat(amount),
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


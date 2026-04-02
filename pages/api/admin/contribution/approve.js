import applyCors from '@/lib/cors';
const Contribution = require('../../../../models/Contribution');
const Notification = require('../../../../models/Notification');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const { sendContributionNotification } = require('../../../../lib/email');
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
    requireAdmin(req);

    const { contributionId, paymentDate: overridePaymentDate } = req.body;

    if (!contributionId) {
      return res.status(400).json({
        success: false,
        error: 'Contribution ID is required',
      });
    }

    // First fetch the contribution to get OCR data
    const existingContribution = await Contribution.findById(contributionId);
    if (!existingContribution) {
      return res.status(404).json({
        success: false,
        error: 'Contribution not found',
      });
    }

    // Resolve payment date (cash must have a date)
    let paymentDate = null;

    // 1) Keep existing paymentDate if already set (cash flow / admin entry)
    if (existingContribution.paymentDate) {
      paymentDate = existingContribution.paymentDate;
    }

    // 2) Admin override
    if (!paymentDate && overridePaymentDate) {
      const parsedOverride = new Date(overridePaymentDate);
      if (Number.isNaN(parsedOverride.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid payment date' });
      }
      paymentDate = parsedOverride;
    }

    // 3) Try OCR date
    if (!paymentDate && existingContribution.ocrData?.date) {
      try {
        const ocrDateStr = existingContribution.ocrData.date;
        const parsedDate = new Date(ocrDateStr);
        if (!isNaN(parsedDate.getTime())) {
          paymentDate = parsedDate;
        }
      } catch (e) {
        console.error('Error parsing payment date:', e);
      }
    }

    // 4) Cash requires explicit date; UPI can fallback to now
    if (!paymentDate) {
      if (existingContribution.paymentMethod === 'cash') {
        return res.status(400).json({
          success: false,
          error: 'Cash contribution must have a payment date before approval',
        });
      }
      paymentDate = new Date();
    }

    const contribution = await Contribution.findByIdAndUpdate(
      contributionId,
      { 
        status: 'done',
        paymentDate: paymentDate
      },
      { new: true }
    ).populate('userId');

    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: 'Contribution not found',
      });
    }

    // Create notification
    await Notification.create({
      userId: contribution.userId._id,
      title: 'Contribution Approved',
      description: `Your contribution for ${contribution.month} has been approved`,
      type: 'contribution',
      relatedId: contribution._id,
    });

    // Send email
    await sendContributionNotification(
      contribution.userId.email,
      contribution.userId.name,
      'done',
      contribution.month
    );

    res.status(200).json({
      success: true,
      data: { contribution },
      message: 'Contribution approved successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to approve contribution');
  }
}

export default handler;


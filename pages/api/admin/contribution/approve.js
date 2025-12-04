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

    const { contributionId } = req.body;

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

    // Extract payment date from OCR data if available
    let paymentDate = null;
    if (existingContribution.ocrData?.date) {
      try {
        // Try to parse the date from OCR (format might vary)
        const ocrDateStr = existingContribution.ocrData.date;
        // Try common date formats
        const parsedDate = new Date(ocrDateStr);
        if (!isNaN(parsedDate.getTime())) {
          paymentDate = parsedDate;
        }
      } catch (e) {
        console.error('Error parsing payment date:', e);
      }
    }
    // If no date from OCR, use current date
    if (!paymentDate) {
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


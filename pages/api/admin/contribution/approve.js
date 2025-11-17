const Contribution = require('../../../../models/Contribution');
const Notification = require('../../../../models/Notification');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const { sendContributionNotification } = require('../../../../lib/email');
const User = require('../../../../models/User');

async function handler(req, res) {
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

    const contribution = await Contribution.findByIdAndUpdate(
      contributionId,
      { status: 'done' },
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


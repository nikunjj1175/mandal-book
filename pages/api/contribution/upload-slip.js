const Contribution = require('../../../models/Contribution');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');
const { uploadToCloudinary } = require('../../../lib/cloudinary');
const { extractTextFromImage } = require('../../../lib/ocr');
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

    const userName = req.user.name;
    const userId = req.user._id;
    const { month, amount, slipImage } = req.body;

    if (!month || !amount || !slipImage) {
      return res.status(400).json({
        success: false,
        error: 'Please provide month, amount, and slip image',
      });
    }

    // Check if contribution already exists for this month
    const existing = await Contribution.findOne({ userId, month });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Contribution for this month already exists',
      });
    }

    // Upload slip image
    const buffer = Buffer.from(slipImage.split(',')[1] || slipImage, 'base64');
    const uploadResult = await uploadToCloudinary(
      buffer,
      `mandal/${userName}/payments`,
      `contribution-${userName}-${month}`
    );

    // Perform OCR
    let ocrResult = { referenceId: null, amount: null, date: null, time: null };
    let ocrStatus = 'pending';

    try {
      ocrResult = await extractTextFromImage(uploadResult.secure_url);
      if (ocrResult.referenceId) {
        ocrStatus = 'success';
      } else {
        ocrStatus = 'failed';
      }
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      ocrStatus = 'failed';
    }

    // Create contribution
    const contribution = await Contribution.create({
      userId,
      month,
      amount,
      slipImage: uploadResult.secure_url,
      referenceId: ocrResult.referenceId,
      ocrStatus,
      ocrData: ocrResult,
      status: 'pending',
    });

    // Create notification for admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await Notification.create({
        userId: admin._id,
        title: 'New Contribution Slip Uploaded',
        description: `${req.user.name} has uploaded contribution slip for ${month}${ocrResult.referenceId ? ` (Ref: ${ocrResult.referenceId})` : ''}`,
        type: 'contribution',
        relatedId: contribution._id,
      });

      await sendAdminNotification(
        admin.email,
        'New Contribution Slip Uploaded',
        `${req.user.name} has uploaded contribution slip for ${month}`
      );
    }

    res.status(201).json({
      success: true,
      data: { contribution },
      message: 'Contribution slip uploaded successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to upload contribution slip');
  }
}

export default handler;


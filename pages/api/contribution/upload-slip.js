import applyCors from '@/lib/cors';
const Contribution = require('../../../models/Contribution');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');
const { uploadToCloudinary } = require('../../../lib/cloudinary');
const { extractTextFromImage } = require('../../../lib/ocr');
const Notification = require('../../../models/Notification');
const User = require('../../../models/User');
const { sendAdminNotification, sendAdminContributionUploadEmail } = require('../../../lib/email');

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

    const userName = req.user.name;
    const userId = req.user._id;
    const { month, amount, slipImage, upiProvider } = req.body;

    if (!month || !amount || !slipImage || !upiProvider) {
      return res.status(400).json({
        success: false,
        error: 'Please provide month, amount, UPI app used, and slip image',
      });
    }

    const normalizedProvider = (upiProvider || '').toLowerCase();
    const allowedProviders = ['gpay', 'phonepe'];
    if (!allowedProviders.includes(normalizedProvider)) {
      return res.status(400).json({
        success: false,
        error: 'Only Google Pay or PhonePe payments are accepted right now.',
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

    // Upload slip image (supports base64 or remote URL)
    const uploadResult = await uploadToCloudinary(
      slipImage,
      `mandal/${userName}/payments`,
      `contribution-${userName}-${month}`
    );

    // Perform OCR
    let ocrResult = { transactionId: null, amount: null, date: null, time: null };
    let ocrStatus = 'pending';

    try {
      ocrResult = await extractTextFromImage(uploadResult.secure_url);
      if (ocrResult?.transactionId) {
        ocrStatus = 'success';
      } else {
        ocrStatus = 'failed';
      }
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      ocrStatus = 'failed';
    }

    console.log(ocrResult);
    
    const transactionId = ocrResult?.transactionId;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Unable to read transaction ID from slip. Please upload a clearer image.',
      });
    }

    const existingTxn = await Contribution.findOne({ transactionId });
    if (existingTxn) {
      return res.status(400).json({
        success: false,
        error: 'This transaction ID is already recorded. Please upload a new slip.',
      });
    }

    const detectedProvider = ocrResult?.upiProvider;

    if (!detectedProvider) {
      return res.status(400).json({
        success: false,
        error: 'Unable to detect UPI app from screenshot. Upload PhonePe or Google Pay receipt.',
      });
    }

    if (detectedProvider !== normalizedProvider) {
      return res.status(400).json({
        success: false,
        error: `Uploaded slip looks like ${detectedProvider === 'gpay' ? 'Google Pay' : 'PhonePe'}, but you selected ${normalizedProvider}. Please select the correct app.`,
      });
    }

    const resolvedProvider = detectedProvider;

    // Create contribution
    const contribution = await Contribution.create({
      userId,
      month,
      amount,
      slipImage: uploadResult.secure_url,
      upiProvider: resolvedProvider,
      ocrStatus,
      ocrData: {
        transactionId,
        amount: ocrResult.amount,
        date: ocrResult.date,
        time: ocrResult.time,
        payeeName: ocrResult.payeeName,
        rawText: ocrResult.text,
      },
      status: 'pending',
    });

    // Create notification for admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await Notification.create({
        userId: admin._id,
        title: 'New Contribution Slip Uploaded',
        description: `${req.user.name} has uploaded contribution slip for ${month}${ocrResult.transactionId ? ` (Ref: ${ocrResult.transactionId})` : ''}`,
        type: 'contribution',
        relatedId: contribution._id,
      });

      const contributionDetails = {
        memberName: req.user.name,
        month,
        enteredAmount: amount,
        detectedAmount: ocrResult.amount,
        transactionId,
        paymentDate: ocrResult.date,
        paymentTime: ocrResult.time,
        toName: ocrResult.payeeName,
        upiProvider: resolvedProvider,
      };

      await sendAdminContributionUploadEmail(admin.email, contributionDetails);
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


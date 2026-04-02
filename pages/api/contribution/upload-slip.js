import applyCors from '@/lib/cors';
const Contribution = require('../../../models/Contribution');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');
const { uploadToCloudinary } = require('../../../lib/cloudinary');
const { extractTextFromImage } = require('../../../lib/ocr');
const Notification = require('../../../models/Notification');
const User = require('../../../models/User');
const { sendAdminNotification, sendAdminContributionUploadEmail } = require('../../../lib/email');
const connectDB = require('../../../lib/mongodb');
const Settings = require('../../../models/Settings');

function parseMonthKey(monthKey) {
  // expects YYYY-MM
  if (typeof monthKey !== 'string') return null;
  const m = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]); // 1-12
  if (!year || month < 1 || month > 12) return null;
  return { year, month };
}

function formatMonthKey({ year, month }) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function addMonths(monthKey, delta) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return null;
  const base = parsed.year * 12 + (parsed.month - 1);
  const next = base + delta;
  const year = Math.floor(next / 12);
  const month = (next % 12) + 1;
  return formatMonthKey({ year, month });
}

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireApprovedMember(req);

    const userName = req.user.name;
    const userId = req.user._id;
    const { month, amount, slipImage, upiProvider, paymentMethod = 'upi', paymentDate } = req.body;

    if (!month || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        error: 'Please provide month and amount',
      });
    }

    const normalizedMethod = String(paymentMethod || '').toLowerCase();
    const allowedMethods = ['upi', 'cash'];
    if (!allowedMethods.includes(normalizedMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method',
      });
    }

    const parsedStartMonth = parseMonthKey(month);
    if (!parsedStartMonth) {
      return res.status(400).json({ success: false, error: 'Invalid month format. Use YYYY-MM.' });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
    }

    // Fetch configured monthly amount for auto-splitting
    const monthlyAmountSetting = await Settings.findOne({ key: 'monthly_contribution_amount' });
    const monthlyFixedAmount = Number(monthlyAmountSetting?.value);
    if (!monthlyAmountSetting || Number.isNaN(monthlyFixedAmount) || monthlyFixedAmount <= 0) {
      return res.status(500).json({
        success: false,
        error: 'Monthly contribution amount not configured. Please contact admin.',
      });
    }

    // Cash requires a paymentDate, UPI requires slip + provider
    let resolvedPaymentDate = null;
    if (normalizedMethod === 'cash') {
      if (!paymentDate) {
        return res.status(400).json({ success: false, error: 'Payment date is required for cash payments' });
      }
      const parsed = new Date(paymentDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid payment date' });
      }
      resolvedPaymentDate = parsed;
    }

    let uploadResult = null;
    let ocrResult = { transactionId: null, amount: null, date: null, time: null };
    let ocrStatus = 'pending';
    let resolvedProvider = undefined;
    let transactionId = null;

    if (normalizedMethod === 'upi') {
      const normalizedProvider = (upiProvider || '').toLowerCase();
      const allowedProviders = ['gpay', 'phonepe'];
      if (!allowedProviders.includes(normalizedProvider)) {
        return res.status(400).json({
          success: false,
          error: 'Only Google Pay or PhonePe payments are accepted right now.',
        });
      }

      if (!slipImage) {
        return res.status(400).json({ success: false, error: 'Slip image is required for UPI payments' });
      }

      // Upload slip image (supports base64 or remote URL)
      uploadResult = await uploadToCloudinary(
        slipImage,
        `mandal/${userName}/payments`,
        `contribution-${userName}-${month}`
      );

      // Perform OCR
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

      transactionId = ocrResult?.transactionId;
      if (!transactionId) {
        return res.status(400).json({
          success: false,
          error: 'Unable to read transaction ID from slip. Please upload a clearer image.',
        });
      }

      const existingTxn = await Contribution.findOne({
        userId,
        'ocrData.transactionId': transactionId,
      });
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
      resolvedProvider = detectedProvider;

      // Best-effort paymentDate from OCR (fallback to now on approval if missing)
      if (ocrResult?.date) {
        const ocrParsed = new Date(ocrResult.date);
        if (!Number.isNaN(ocrParsed.getTime())) {
          resolvedPaymentDate = ocrParsed;
        }
      }
    }

    // Auto-split across months by fixed monthly amount
    let remaining = numericAmount;
    let cursorMonth = month;
    const created = [];

    // Prevent infinite loops if many months already exist
    for (let guard = 0; guard < 240 && remaining > 0; guard++) {
      const existingForMonth = await Contribution.findOne({
        userId,
        month: cursorMonth,
        status: { $ne: 'rejected' },
      }).lean();

      if (existingForMonth) {
        cursorMonth = addMonths(cursorMonth, 1);
        if (!cursorMonth) break;
        continue;
      }

      const chunk = Math.min(remaining, monthlyFixedAmount);

      const contribution = await Contribution.create({
        userId,
        month: cursorMonth,
        amount: chunk,
        paymentMethod: normalizedMethod,
        slipImage: uploadResult?.secure_url,
        upiProvider: resolvedProvider,
        ocrStatus: normalizedMethod === 'upi' ? ocrStatus : 'pending',
        ...(normalizedMethod === 'upi'
          ? {
              ocrData: {
                transactionId,
                amount: ocrResult.amount,
                date: ocrResult.date,
                time: ocrResult.time,
                payeeName: ocrResult.payeeName,
                rawText: ocrResult.text,
              },
            }
          : {}),
        paymentDate: resolvedPaymentDate || undefined,
        status: 'pending',
        enteredBy: 'member',
      });

      created.push(contribution);
      remaining -= chunk;
      cursorMonth = addMonths(cursorMonth, 1);
      if (!cursorMonth) break;
    }

    if (created.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Unable to create contribution entries (months may already be submitted)',
      });
    }

    // Create notification for admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await Notification.create({
        userId: admin._id,
        title: 'New Contribution Slip Uploaded',
        description:
          normalizedMethod === 'cash'
            ? `${req.user.name} has added a cash contribution starting ${month} (₹${numericAmount}).`
            : `${req.user.name} has uploaded contribution slip for ${month}${ocrResult.transactionId ? ` (Ref: ${ocrResult.transactionId})` : ''}`,
        type: 'contribution',
        relatedId: created[0]._id,
      });

      const contributionDetails = {
        memberName: req.user.name,
        month,
        enteredAmount: numericAmount,
        detectedAmount: ocrResult.amount,
        transactionId,
        paymentDate: normalizedMethod === 'cash' ? paymentDate : ocrResult.date,
        paymentTime: ocrResult.time,
        toName: ocrResult.payeeName,
        upiProvider: resolvedProvider,
        paymentMethod: normalizedMethod,
        createdMonths: created.map((c) => c.month),
      };

      await sendAdminContributionUploadEmail(admin.email, contributionDetails);
    }

    res.status(201).json({
      success: true,
      data: { contributions: created },
      message: 'Contribution submitted successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to upload contribution slip');
  }
}

export default handler;


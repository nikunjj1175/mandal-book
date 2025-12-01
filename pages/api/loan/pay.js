import applyCors from '@/lib/cors';
const Loan = require('../../../models/Loan');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');
const { uploadToCloudinary } = require('../../../lib/cloudinary');
const { extractTextFromImage } = require('../../../lib/ocr');
const Notification = require('../../../models/Notification');
const User = require('../../../models/User');
const { sendAdminNotification } = require('../../../lib/email');

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
    const { loanId, amount, slipImage } = req.body;

    if (!loanId || !amount || !slipImage) {
      return res.status(400).json({
        success: false,
        error: 'Please provide loan ID, amount, and payment slip image',
      });
    }

    const loan = await Loan.findOne({ _id: loanId, userId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found',
      });
    }

    if (loan.status !== 'active' && loan.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Loan is not active. Cannot make payment.',
      });
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount > loan.pendingAmount) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount cannot exceed pending amount',
      });
    }

    // Upload slip image
    const buffer = Buffer.from(slipImage.split(',')[1] || slipImage, 'base64');
    const uploadResult = await uploadToCloudinary(
      buffer,
      `mandal/${userName}/loan-payments`,
      `loan-payment-${userName}-${loanId}-${Date.now()}`
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

    // Add payment to installments
    // Ensure pending amount is calculated correctly (should include interest if loan is approved)
    let currentPendingAmount = loan.pendingAmount;
    
    // If loan has interest but pendingAmount doesn't reflect it, recalculate
    if (loan.interestAmount > 0 && loan.totalPayable > loan.amount) {
      // Recalculate to ensure pending amount includes interest
      const totalPayable = loan.totalPayable || (loan.amount + loan.interestAmount);
      const totalPaid = (loan.installmentsPaid || []).reduce((sum, inst) => sum + (inst.amount || 0), 0);
      currentPendingAmount = totalPayable - totalPaid;
    }
    
    const newPendingAmount = Math.max(0, Math.round((currentPendingAmount - paymentAmount) * 100) / 100);
    
    const updatedLoan = await Loan.findByIdAndUpdate(
      loanId,
      {
        $push: {
          installmentsPaid: {
            amount: Math.round(paymentAmount * 100) / 100,
            date: new Date(),
            referenceId: ocrResult.referenceId || null,
            // Store full Cloudinary URL in DB
            slipImage: uploadResult.secure_url,
            status: 'pending',
          },
        },
        pendingAmount: newPendingAmount,
        status: newPendingAmount <= 0 ? 'closed' : loan.status,
      },
      { new: true }
    );

    // Create notification for admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await Notification.create({
        userId: admin._id,
        title: 'Loan Payment Received',
        description: `${req.user.name} has made a payment of ₹${paymentAmount} towards loan (Ref: ${ocrResult.referenceId || 'N/A'})`,
        type: 'loan',
        relatedId: loan._id,
      });

      await sendAdminNotification(
        admin.email,
        'Loan Payment Received',
        `${req.user.name} has made a payment of ₹${paymentAmount} towards loan`
      );
    }

    res.status(200).json({
      success: true,
      data: { loan: updatedLoan },
      message: 'Loan payment submitted successfully. Waiting for admin approval.',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to process loan payment');
  }
}

export default handler;


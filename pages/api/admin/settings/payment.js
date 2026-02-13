import applyCors from '@/lib/cors';
const connectDB = require('../../../../lib/mongodb');
const Settings = require('../../../../models/Settings');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const { uploadToCloudinary } = require('../../../../lib/cloudinary');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireAdmin(req);

    if (req.method === 'GET') {
      // Get payment settings
      const qrCodeSetting = await Settings.findOne({ key: 'payment_qr_code_url' });
      const upiIdSetting = await Settings.findOne({ key: 'payment_upi_id' });
      const monthlyAmountSetting = await Settings.findOne({ key: 'monthly_contribution_amount' });

      return res.status(200).json({
        success: true,
        data: {
          qrCodeUrl: qrCodeSetting?.value || null,
          upiId: upiIdSetting?.value || null,
          monthlyContributionAmount: monthlyAmountSetting?.value || null,
        },
      });
    }

    if (req.method === 'POST') {
      // Update payment settings
      const { qrCodeUrl, upiId, qrCodeImage, monthlyContributionAmount } = req.body;

      // Handle QR code image upload if provided
      let finalQrCodeUrl = qrCodeUrl;
      if (qrCodeImage && qrCodeImage.startsWith('data:image')) {
        try {
          const buffer = Buffer.from(qrCodeImage.split(',')[1] || qrCodeImage, 'base64');
          const uploadResult = await uploadToCloudinary(
            buffer,
            'mandal/payment-settings',
            `qr-code-${Date.now()}`
          );
          finalQrCodeUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('QR code upload error:', uploadError);
          return res.status(400).json({
            success: false,
            error: 'Failed to upload QR code image',
          });
        }
      }

      // Update or create QR code setting
      if (finalQrCodeUrl !== undefined) {
        await Settings.findOneAndUpdate(
          { key: 'payment_qr_code_url' },
          { 
            key: 'payment_qr_code_url',
            value: finalQrCodeUrl || null,
            description: 'Payment QR Code URL'
          },
          { upsert: true, new: true }
        );
      }

      // Update or create UPI ID setting
      if (upiId !== undefined) {
        await Settings.findOneAndUpdate(
          { key: 'payment_upi_id' },
          { 
            key: 'payment_upi_id',
            value: upiId || null,
            description: 'Payment UPI ID'
          },
          { upsert: true, new: true }
        );
      }

      // Update or create Monthly Contribution Amount setting
      if (monthlyContributionAmount !== undefined) {
        await Settings.findOneAndUpdate(
          { key: 'monthly_contribution_amount' },
          {
            key: 'monthly_contribution_amount',
            value: monthlyContributionAmount || null,
            description: 'Default monthly contribution amount (INR)',
          },
          { upsert: true, new: true }
        );
      }

      // Get updated settings
      const updatedQrCode = await Settings.findOne({ key: 'payment_qr_code_url' });
      const updatedUpiId = await Settings.findOne({ key: 'payment_upi_id' });
      const updatedMonthlyAmount = await Settings.findOne({ key: 'monthly_contribution_amount' });

      return res.status(200).json({
        success: true,
        data: {
          qrCodeUrl: updatedQrCode?.value || null,
          upiId: updatedUpiId?.value || null,
          monthlyContributionAmount: updatedMonthlyAmount?.value || null,
        },
        message: 'Payment settings updated successfully',
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to handle payment settings');
  }
}

export default handler;


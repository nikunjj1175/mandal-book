import applyCors from '@/lib/cors';
const connectDB = require('../../../lib/mongodb');
const Settings = require('../../../models/Settings');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    // Get payment settings (public endpoint for all users)
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payment settings',
    });
  }
}

export default handler;


import applyCors from '@/lib/cors';
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');
const connectDB = require('../../../lib/mongodb');
const Settings = require('../../../models/Settings');
const DEFAULT_UPI_NAME = 'Mandal Group';

function getCurrentMonthYear() {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'short' }); // e.g. Feb
  const year = now.getFullYear(); // e.g. 2026
  const key = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
  return { label: `${month}-${year}`, key };
}

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireApprovedMember(req);

    const userId = req.user._id.toString();
    const { label, key } = getCurrentMonthYear();

    // Read current UPI ID & monthly amount from Settings configured by admin
    const [upiIdSetting, monthlyAmountSetting] = await Promise.all([
      Settings.findOne({ key: 'payment_upi_id' }),
      Settings.findOne({ key: 'monthly_contribution_amount' }),
    ]);

    const upiVpa = upiIdSetting?.value;

    if (!upiVpa) {
      return res.status(500).json({
        success: false,
        error: 'UPI ID not configured. Please contact admin.',
      });
    }

    const paymentIntentId = `${userId}-${key}-${Date.now()}`;

    if (
      monthlyAmountSetting?.value === undefined ||
      monthlyAmountSetting?.value === null ||
      Number.isNaN(Number(monthlyAmountSetting.value))
    ) {
      return res.status(500).json({
        success: false,
        error: 'Monthly contribution amount not configured. Please contact admin.',
      });
    }

    const amount = Number(monthlyAmountSetting.value);
    const upiName = DEFAULT_UPI_NAME;
    const note = `Mandal Contribution ${label}`;

    const upiUrl = `upi://pay?pa=${encodeURIComponent(
      upiVpa
    )}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      note
    )}`;

    return res.status(200).json({
      success: true,
      data: {
        upiUrl,
        upiVpa,
        upiName,
        amount,
        monthLabel: label,
        monthKey: key,
        note,
        paymentIntentId,
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch UPI config');
  }
}

export default handler;


import applyCors from '@/lib/cors';
const mongoose = require('mongoose');
const connectDB = require('../../../../lib/mongodb');
const Contribution = require('../../../../models/Contribution');
const Settings = require('../../../../models/Settings');
const Notification = require('../../../../models/Notification');
const User = require('../../../../models/User');
const { authenticate, requireAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');

function parseMonthKey(monthKey) {
  if (typeof monthKey !== 'string') return null;
  const m = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
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
    requireAdmin(req);

    const { memberId, month, amount, paymentMethod = 'cash', paymentDate } = req.body;

    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, error: 'Valid memberId is required' });
    }
    if (!month || !parseMonthKey(month)) {
      return res.status(400).json({ success: false, error: 'Invalid month format. Use YYYY-MM.' });
    }
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
    }

    const normalizedMethod = String(paymentMethod || '').toLowerCase();
    if (!['cash', 'upi'].includes(normalizedMethod)) {
      return res.status(400).json({ success: false, error: 'Invalid payment method' });
    }

    let resolvedPaymentDate = null;
    if (paymentDate) {
      const parsed = new Date(paymentDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid payment date' });
      }
      resolvedPaymentDate = parsed;
    }

    if (normalizedMethod === 'cash' && !resolvedPaymentDate) {
      return res.status(400).json({ success: false, error: 'Payment date is required for cash payments' });
    }

    const monthlyAmountSetting = await Settings.findOne({ key: 'monthly_contribution_amount' });
    const monthlyFixedAmount = Number(monthlyAmountSetting?.value);
    if (!monthlyAmountSetting || Number.isNaN(monthlyFixedAmount) || monthlyFixedAmount <= 0) {
      return res.status(500).json({
        success: false,
        error: 'Monthly contribution amount not configured. Please contact admin.',
      });
    }

    let remaining = numericAmount;
    let cursorMonth = month;
    const created = [];

    for (let guard = 0; guard < 240 && remaining > 0; guard++) {
      const existingForMonth = await Contribution.findOne({
        userId: memberId,
        month: cursorMonth,
        status: { $ne: 'rejected' },
      }).lean();

      if (existingForMonth) {
        cursorMonth = addMonths(cursorMonth, 1);
        if (!cursorMonth) break;
        continue;
      }

      const chunk = Math.min(remaining, monthlyFixedAmount);
      const doc = await Contribution.create({
        userId: memberId,
        month: cursorMonth,
        amount: chunk,
        paymentMethod: normalizedMethod,
        paymentDate: resolvedPaymentDate || undefined,
        status: 'pending',
        enteredBy: 'admin',
      });
      created.push(doc);
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

    // Notify member + admin (for audit)
    const member = await User.findById(memberId).select('name email').lean();
    if (member?._id) {
      await Notification.create({
        userId: member._id,
        title: 'Contribution Added',
        description: `Admin added a ${normalizedMethod} contribution starting ${month} (₹${numericAmount}). Pending approval.`,
        type: 'contribution',
        relatedId: created[0]._id,
      });
    }

    res.status(201).json({
      success: true,
      data: { contributions: created },
      message: 'Contribution entries created',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to create contribution');
  }
}

export default handler;


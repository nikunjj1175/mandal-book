import applyCors from '@/lib/cors';
const connectDB = require('../../../lib/mongodb');
const Invoice = require('../../../models/Invoice');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');

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
    if (req.user.role !== 'admin') {
      requireApprovedMember(req);
    }

    const invoices = await Invoice.find({})
      .select('-documentPublicId')
      .sort({ purchaseDate: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: { invoices } });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch invoices');
  }
}

export default handler;


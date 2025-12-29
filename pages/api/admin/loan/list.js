const connectDB = require('../../../../lib/mongodb');
const Loan = require('../../../../models/Loan');
const { authenticate, requireAdminOrSuperAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');
const applyCors = require('../../../../lib/cors');

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireAdminOrSuperAdmin(req);

    const { status } = req.query;
    const query = status && status !== 'all' ? { status } : {};

    const loans = await Loan.find(query)
      .populate('userId', 'name email mobile profilePic')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { loans },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch loans');
  }
}



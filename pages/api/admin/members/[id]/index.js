const connectDB = require('../../../../../../lib/mongodb');
const User = require('../../../../../../models/User');
const { authenticate, requireAdmin } = require('../../../../../../middleware/auth');
const { handleApiError } = require('../../../../../../lib/utils');
const applyCors = require('../../../../../../lib/cors');

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (!['GET', 'PUT'].includes(req.method)) {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireAdmin(req);

    const { id } = req.query;

    if (req.method === 'GET') {
      const member = await User.findById(id).select('-password').lean();
      if (!member) {
        return res.status(404).json({ success: false, error: 'Member not found' });
      }
      return res.status(200).json({ success: true, data: { member } });
    }

    if (req.method === 'PUT') {
      const { kycStatus, adminApprovalStatus, adminApprovalRemarks } = req.body;
      const member = await User.findByIdAndUpdate(
        id,
        {
          kycStatus,
          adminApprovalStatus,
          adminApprovalRemarks,
        },
        { new: true }
      )
        .select('-password')
        .lean();

      if (!member) {
        return res.status(404).json({ success: false, error: 'Member not found' });
      }

      return res.status(200).json({ success: true, data: { member } });
    }
  } catch (error) {
    return handleApiError(res, error, 'Failed to process member');
  }
}



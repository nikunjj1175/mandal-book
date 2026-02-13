import applyCors from '@/lib/cors';
const { authenticate } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          kycStatus: user.kycStatus,
          profilePic: user.profilePic,
          dob: user.dob,
          address: user.address,
          emailVerified: user.emailVerified,
          adminApprovalStatus: user.adminApprovalStatus,
          isActive: user.isActive,
          // KYC-related extra fields for profile page
          aadhaarNumber: user.aadhaarNumber,
          aadhaarFront: user.aadhaarFront,
          panNumber: user.panNumber,
          panImage: user.panImage,
          bankDetails: user.bankDetails,
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch user data');
  }
}

export default handler;


import applyCors from '@/lib/cors';
const User = require('../../models/User');
const Contribution = require('../../models/Contribution');
const { authenticate, requireApprovedMember } = require('../../middleware/auth');
const { handleApiError, maskAadhaar, maskPAN, maskAccountNumber } = require('../../lib/utils');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireApprovedMember(req);

    const currentUserId = req.user._id.toString();
    const members = await User.find({ role: 'member' })
      .select('-password')
      .lean();

    // Get contributions for current user
    const userContributions = await Contribution.find({
      userId: currentUserId,
    }).lean();

    const membersWithStatus = await Promise.all(
      members.map(async (member) => {
        const isCurrentUser = member._id.toString() === currentUserId;
        
        // Get contribution status for this member
        const contributions = await Contribution.find({
          userId: member._id,
        }).lean();

        return {
          id: member._id,
          name: member.name,
          email: member.email,
          mobile: member.mobile,
          profilePic: member.profilePic,
          kycStatus: member.kycStatus,
          // Mask sensitive data
          aadhaarNumber: isCurrentUser ? member.aadhaarNumber : maskAadhaar(member.aadhaarNumber),
          panNumber: isCurrentUser ? member.panNumber : maskPAN(member.panNumber),
          bankDetails: member.bankDetails
            ? {
                ...member.bankDetails,
                accountNumber: isCurrentUser
                  ? member.bankDetails.accountNumber
                  : maskAccountNumber(member.bankDetails.accountNumber),
              }
            : null,
          contributionStatus: contributions.map((c) => ({
            month: c.month,
            status: c.status,
            amount: c.amount,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { members: membersWithStatus },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to fetch members');
  }
}

export default handler;


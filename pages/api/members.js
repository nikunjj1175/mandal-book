import applyCors from '@/lib/cors';
const User = require('../../models/User');
const Contribution = require('../../models/Contribution');
const Loan = require('../../models/Loan');
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

        // Get loan information for this member
        const loans = await Loan.find({
          userId: member._id,
        }).lean();

        // Calculate loan summary
        const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'approved');
        const totalLoanAmount = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
        const totalPendingAmount = loans.reduce((sum, l) => sum + (l.pendingAmount || 0), 0);
        const totalPaidAmount = loans.reduce((sum, l) => {
          const paid = (l.installmentsPaid || [])
            .filter(inst => inst.status === 'approved')
            .reduce((s, inst) => s + (inst.amount || 0), 0);
          return sum + paid;
        }, 0);

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
          loanInfo: {
            totalLoans: loans.length,
            activeLoans: activeLoans.length,
            totalLoanAmount,
            totalPendingAmount,
            totalPaidAmount,
            loans: loans.map(l => ({
              _id: l._id,
              amount: l.amount,
              pendingAmount: l.pendingAmount,
              status: l.status,
              interestRate: l.interestRate,
              createdAt: l.createdAt,
            })),
          },
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


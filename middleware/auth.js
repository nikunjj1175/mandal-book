const { verifyToken, getTokenFromRequest, handleApiError } = require('../lib/utils');
const User = require('../models/User');
const connectDB = require('../lib/mongodb');

async function authenticate(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      await connectDB();
      const token = getTokenFromRequest(req);
      
      if (!token) {
        return reject({ statusCode: 401, message: 'Authentication required' });
      }

      const decoded = verifyToken(token);
      
      if (!decoded) {
        return reject({ statusCode: 401, message: 'Invalid or expired token' });
      }

      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return reject({ statusCode: 401, message: 'User not found' });
      }

      // Check if user is active
      if (user.isActive === false) {
        return reject({ 
          statusCode: 403, 
          message: 'Your account has been deactivated. Please contact admin.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      req.user = user;
      resolve();
    } catch (error) {
      reject({ statusCode: 500, message: 'Authentication failed', originalError: error });
    }
  });
}

function requireAdmin(req) {
  if (!req.user) {
    throw { statusCode: 401, message: 'Authentication required' };
  }

  if (req.user.role !== 'admin') {
    throw { statusCode: 403, message: 'Admin access required' };
  }
}

function requireApprovedMember(req) {
  if (!req.user) {
    throw { statusCode: 401, message: 'Authentication required' };
  }

  // Only members are allowed to access these member-only actions
  if (req.user.role !== 'member') {
    throw { statusCode: 403, message: 'Only members can perform this action.' };
  }

  if (req.user.adminApprovalStatus !== 'approved') {
    throw { statusCode: 403, message: 'Your account is awaiting admin approval.' };
  }

  if (req.user.kycStatus !== 'verified') {
    throw { statusCode: 403, message: 'Please complete KYC verification to use this service.', code: 'KYC_REQUIRED' };
  }
}

module.exports = {
  authenticate,
  requireAdmin,
  requireApprovedMember,
};


const { authenticate, requireAdmin } = require('../middleware/auth');
const { handleApiError, decryptRequestDates } = require('./utils');

async function withAuth(handler) {
  return async (req, res) => {
    try {
      await authenticate(req, res);
      // Decrypt dates in request body
      decryptRequestDates(req);
      return await handler(req, res);
    } catch (error) {
      return handleApiError(res, error, 'Authentication failed');
    }
  };
}

async function withAdmin(handler) {
  return async (req, res) => {
    try {
      await authenticate(req, res);
      requireAdmin(req);
      // Decrypt dates in request body
      decryptRequestDates(req);
      return await handler(req, res);
    } catch (error) {
      return handleApiError(res, error, 'Authorization failed');
    }
  };
}

module.exports = {
  withAuth,
  withAdmin,
};


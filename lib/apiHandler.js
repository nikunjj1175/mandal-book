const { authenticate, requireAdmin } = require('../middleware/auth');
const { handleApiError } = require('./utils');

async function withAuth(handler) {
  return async (req, res) => {
    try {
      await authenticate(req, res);
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


import applyCors from '@/lib/cors';
const connectDB = require('../../../../../lib/mongodb');
const Group = require('../../../../../models/Group');
const { authenticate, requireSuperAdmin } = require('../../../../../middleware/auth');
const { handleApiError } = require('../../../../../lib/utils');

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  const {
    query: { id },
    method,
  } = req;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Group ID is required' });
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireSuperAdmin(req);

    if (method === 'PUT') {
      const { name, code, description, isActive } = req.body || {};

      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Group name is required',
        });
      }

      const group = await Group.findByIdAndUpdate(
        id,
        {
          name,
          code: code ?? undefined,
          description: description ?? undefined,
          ...(typeof isActive === 'boolean' ? { isActive } : {}),
        },
        { new: true }
      ).lean();

      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Group not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: { group },
        message: 'Group updated successfully',
      });
    }

    if (method === 'GET') {
      const group = await Group.findById(id).lean();
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Group not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: { group },
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to handle group');
  }
}



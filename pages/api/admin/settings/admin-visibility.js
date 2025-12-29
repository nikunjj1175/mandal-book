import applyCors from '@/lib/cors';
const connectDB = require('../../../../lib/mongodb');
const Settings = require('../../../../models/Settings');
const { authenticate, requireSuperAdmin } = require('../../../../middleware/auth');
const { handleApiError } = require('../../../../lib/utils');

const VISIBILITY_KEY = 'admin_visibility_config';

const defaultConfig = {
  showOverview: true,
  showApprovals: true,
  showKyc: true,
  showContributions: true,
  showLoans: true,
  showMembers: true,
  showSettings: true,
};

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireSuperAdmin(req);

    if (req.method === 'GET') {
      const setting = await Settings.findOne({ key: VISIBILITY_KEY });
      let config = defaultConfig;

      if (setting?.value) {
        try {
          const parsed = JSON.parse(setting.value);
          config = { ...defaultConfig, ...parsed };
        } catch (e) {
          // ignore parse error, fallback to default
        }
      }

      return res.status(200).json({
        success: true,
        data: config,
      });
    }

    if (req.method === 'POST') {
      const incoming = req.body || {};
      const merged = { ...defaultConfig, ...incoming };

      await Settings.findOneAndUpdate(
        { key: VISIBILITY_KEY },
        {
          key: VISIBILITY_KEY,
          value: JSON.stringify(merged),
          description: 'Controls which sections normal admins can see in admin dashboard',
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        data: merged,
        message: 'Admin visibility settings updated successfully',
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return handleApiError(res, error, 'Failed to handle admin visibility settings');
  }
}

export default handler;



import applyCors from '@/lib/cors';
const User = require('../../../models/User');
const { authenticate } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');
const { uploadToCloudinary } = require('../../../lib/cloudinary');

async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);

    const userId = req.user._id;
    const userName = req.user.name || 'member';
    const { name, dob, address, profilePic } = req.body;

    const updateData = {};

    if (typeof name === 'string') updateData.name = name.trim();
    if (typeof dob === 'string') updateData.dob = dob;
    if (typeof address === 'string') updateData.address = address.trim();

    // If profilePic is provided as a base64 string, upload to Cloudinary
    if (profilePic && typeof profilePic === 'string') {
      const baseFolder = `mandal/${userName}/kyc/profile`;
      const buffer = Buffer.from(profilePic.split(',')[1] || profilePic, 'base64');
      const result = await uploadToCloudinary(buffer, baseFolder, `profile-${userName}`);
      updateData.profilePic = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to update profile');
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default handler;


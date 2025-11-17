const User = require('../../../models/User');
const { authenticate, requireApprovedMember } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');
const { uploadToCloudinary } = require('../../../lib/cloudinary');
const Notification = require('../../../models/Notification');
const { sendAdminNotification } = require('../../../lib/email');
const UserModel = require('../../../models/User');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await authenticate(req, res);
    requireApprovedMember(req);

    const userId = req.user._id;
    const {
      aadhaarNumber,
      panNumber,
      bankDetails,
      aadhaarFront,
      aadhaarBack,
      panImage,
      passbookImage,
    } = req.body;

    // Validate required fields
    if (!aadhaarNumber || !panNumber || !bankDetails) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required KYC documents',
      });
    }

    const updateData = {
      aadhaarNumber,
      panNumber,
      bankDetails: {
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        bankName: bankDetails.bankName,
        accountHolderName: bankDetails.accountHolderName,
      },
      kycStatus: 'under_review',
    };

    const baseFolder = `mandal/${userId}/kyc`;

    // Upload images if provided as base64
    if (aadhaarFront) {
      const buffer = Buffer.from(aadhaarFront.split(',')[1] || aadhaarFront, 'base64');
      const result = await uploadToCloudinary(buffer, `${baseFolder}/aadhaar`, `aadhaar-front-${userId}`);
      updateData.aadhaarFront = result.secure_url;
    }

    if (aadhaarBack) {
      const buffer = Buffer.from(aadhaarBack.split(',')[1] || aadhaarBack, 'base64');
      const result = await uploadToCloudinary(buffer, `${baseFolder}/aadhaar`, `aadhaar-back-${userId}`);
      updateData.aadhaarBack = result.secure_url;
    }

    if (panImage) {
      const buffer = Buffer.from(panImage.split(',')[1] || panImage, 'base64');
      const result = await uploadToCloudinary(buffer, `${baseFolder}/pan`, `pan-${userId}`);
      updateData.panImage = result.secure_url;
    }

    if (passbookImage) {
      const buffer = Buffer.from(passbookImage.split(',')[1] || passbookImage, 'base64');
      const result = await uploadToCloudinary(buffer, `${baseFolder}/passbook`, `passbook-${userId}`);
      updateData.bankDetails.passbookImage = result.secure_url;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

    // Create notification for admin
    const admin = await UserModel.findOne({ role: 'admin' });
    if (admin) {
      await Notification.create({
        userId: admin._id,
        title: 'New KYC Submission',
        description: `${user.name} has submitted KYC documents for review`,
        type: 'kyc',
        relatedId: user._id,
      });

      // Send email to admin
      await sendAdminNotification(
        admin.email,
        'New KYC Submission',
        `${user.name} has submitted KYC documents for review`
      );
    }

    res.status(200).json({
      success: true,
      data: { user },
      message: 'KYC documents uploaded successfully. Waiting for admin approval.',
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to upload documents');
  }
}

export default handler;


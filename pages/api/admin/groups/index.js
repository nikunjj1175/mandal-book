import applyCors from '@/lib/cors';
const connectDB = require('../../../lib/mongodb');
const User = require('../../../models/User');
const Group = require('../../../models/Group');
const { authenticate, requireSuperAdmin } = require('../../../middleware/auth');
const { handleApiError } = require('../../../lib/utils');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../../../lib/email');

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$';
  let pwd = '';
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await connectDB();
    await authenticate(req, res);
    requireSuperAdmin(req);

    const { name, code, description, adminEmail, otp, features } = req.body || {};

    if (!name || !adminEmail || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Group name, admin email and OTP are required',
      });
    }

    const normalizedEmail = adminEmail.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found. Please send OTP first.',
      });
    }

    if (!user.emailOTP || !user.emailOTPExpiresAt) {
      return res.status(400).json({
        success: false,
        error: 'OTP not generated. Please send OTP again.',
      });
    }

    if (user.emailOTP !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please try again.',
      });
    }

    if (user.emailOTPExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please send OTP again.',
      });
    }

    // Create group with feature flags
    const group = await Group.create({
      name,
      code: code || undefined,
      description: description || undefined,
      features: {
        contributions: features?.contributions !== false,
        loans: features?.loans !== false,
        members: features?.members !== false,
        kyc: features?.kyc !== false,
      },
    });

    // Assign admin to this group and finalize credentials
    const initialPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    user.role = 'admin';
    user.groupId = group._id;
    user.password = hashedPassword;
    user.emailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpiresAt = undefined;
    user.adminApprovalStatus = 'approved';
    user.isActive = true;
    await user.save();

    // Send welcome email with initial password
    const appUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mandal-book.vercel.app';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <div style="background: linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 You are now Group Admin</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hello <strong>${user.name || 'Admin'}</strong>,
          </p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            You have been assigned as <strong>Group Admin</strong> for group <strong>${group.name}</strong> on Mandal-Book.
          </p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">You can login using:</p>
            <p style="margin: 0; font-size: 14px; color: #111827;"><strong>Email:</strong> ${user.email}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #111827;"><strong>Temporary Password:</strong> ${initialPassword}</p>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
            For security, please login and then use the <strong>Forgot Password</strong> flow to set a new password of your choice.
          </p>
          <div style="margin: 30px 0;">
            <a href="${appUrl}/login"
               style="display: inline-block; background: linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Go to Login
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Best regards,<br><strong>Mandal-Book Super Admin</strong>
          </p>
        </div>
      </div>
    `;

    await sendEmail(user.email, 'Your Group Admin Account for Mandal-Book', html);

    return res.status(201).json({
      success: true,
      message: 'Group created and admin assigned successfully',
      data: {
        group,
        admin: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          groupId: user.groupId,
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error, 'Failed to create group');
  }
}



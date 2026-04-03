import applyCors from '@/lib/cors';
const { sendEmail } = require('../../../lib/email');

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  if (await applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { name, email, message } = req.body || {};
    const senderName = (name || '').trim();
    const senderEmail = (email || '').trim().toLowerCase();
    const senderMessage = (message || '').trim();

    if (!senderName || !senderEmail || !senderMessage) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email.' });
    }

    const adminEmail =
      process.env.SUPPORT_ADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL ||
      process.env.SMTP_USER;

    if (!adminEmail) {
      return res.status(500).json({ success: false, error: 'Admin email is not configured.' });
    }

    const safeName = escapeHtml(senderName);
    const safeEmail = escapeHtml(senderEmail);
    const safeMessage = escapeHtml(senderMessage).replace(/\n/g, '<br/>');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 24px; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0; color: #ffffff; font-size: 22px;">New Support Query</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; padding: 24px; background: #ffffff;">
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #374151;"><strong>Name:</strong> ${safeName}</p>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #374151;"><strong>Email:</strong> ${safeEmail}</p>
          <div style="margin-top: 16px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Query</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #0f172a;">${safeMessage}</p>
          </div>
        </div>
      </div>
    `;

    const result = await sendEmail(adminEmail, `Support Query from ${senderName}`, html);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send support query.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Support query sent successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process support query.',
    });
  }
}

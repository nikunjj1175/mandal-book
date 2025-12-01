const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, html) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email not configured. Skipping email send.');
      return { success: false, error: 'Email not configured' };
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

async function sendKYCNotification(userEmail, userName, status) {
  const statusMessages = {
    verified: {
      subject: 'KYC Verification Approved',
      message: 'Your KYC has been verified and approved by the admin.',
      icon: '✅',
      color: '#10b981',
      bgColor: '#d1fae5',
    },
    rejected: {
      subject: 'KYC Verification Rejected',
      message: 'Your KYC verification has been rejected. Please check the remarks and resubmit.',
      icon: '❌',
      color: '#ef4444',
      bgColor: '#fee2e2',
    },
    under_review: {
      subject: 'KYC Under Review',
      message: 'Your KYC documents are under review by the admin.',
      icon: '⏳',
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
  };

  const { subject, message, icon, color, bgColor } = statusMessages[status] || statusMessages.under_review;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${icon} ${subject}</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello <strong>${userName}</strong>,</p>
        <div style="background: ${bgColor}; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: ${color}; font-weight: 600; font-size: 16px;">
            ${message}
          </p>
        </div>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://mandal-book.vercel.app'}/kyc" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            View KYC Status
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Best regards,<br><strong>Mandal-Book Team</strong>
        </p>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
}

async function sendContributionNotification(userEmail, userName, status, month) {
  const statusMessages = {
    done: {
      subject: 'Contribution Approved',
      message: `Your contribution for ${month} has been approved by the admin.`,
      icon: '✅',
      color: '#10b981',
      bgColor: '#d1fae5',
    },
    rejected: {
      subject: 'Contribution Rejected',
      message: `Your contribution for ${month} has been rejected. Please check the remarks and resubmit.`,
      icon: '❌',
      color: '#ef4444',
      bgColor: '#fee2e2',
    },
  };

  const { subject, message, icon, color, bgColor } = statusMessages[status] || statusMessages.done;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${icon} ${subject}</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello <strong>${userName}</strong>,</p>
        <div style="background: ${bgColor}; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: ${color}; font-weight: 600; font-size: 16px;">
            ${message}
          </p>
        </div>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://mandal-book.vercel.app'}/contributions" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            View Contributions
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Best regards,<br><strong>Mandal-Book Team</strong>
        </p>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
}

async function sendLoanNotification(userEmail, userName, status) {
  const statusMessages = {
    approved: {
      subject: 'Loan Request Approved',
      message: 'Your loan request has been approved by the admin.',
      icon: '✅',
      color: '#10b981',
      bgColor: '#d1fae5',
    },
    rejected: {
      subject: 'Loan Request Rejected',
      message: 'Your loan request has been rejected. Please check the remarks.',
      icon: '❌',
      color: '#ef4444',
      bgColor: '#fee2e2',
    },
  };

  const { subject, message, icon, color, bgColor } = statusMessages[status] || statusMessages.approved;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${icon} ${subject}</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello <strong>${userName}</strong>,</p>
        <div style="background: ${bgColor}; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: ${color}; font-weight: 600; font-size: 16px;">
            ${message}
          </p>
        </div>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://mandal-book.vercel.app'}/loans" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            View Loan Details
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Best regards,<br><strong>Mandal-Book Team</strong>
        </p>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
}

async function sendAdminNotification(adminEmail, title, description) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔔 ${title}</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">${description}</p>
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 16px;">
            Action Required: Please review and take necessary action from your admin dashboard.
          </p>
        </div>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://mandal-book.vercel.app'}/admin" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Go to Admin Dashboard
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Best regards,<br><strong>Mandal-Book Team</strong>
        </p>
      </div>
    </div>
  `;

  return await sendEmail(adminEmail, title, html);
}

function formatDetailRow(label, value) {
  if (!value) return '';
  return `<tr>
    <td style="padding:8px 12px;font-weight:600;color:#111827;font-size:14px;border-bottom:1px solid #e5e7eb;">${label}</td>
    <td style="padding:8px 12px;color:#374151;font-size:14px;border-bottom:1px solid #e5e7eb;">${value}</td>
  </tr>`;
}

async function sendAdminContributionUploadEmail(adminEmail, details) {
  const {
    memberName,
    month,
    enteredAmount,
    detectedAmount,
    transactionId,
    paymentDate,
    paymentTime,
    fromName,
    toName,
    upiProvider,
  } = details;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📄 New Contribution Slip Uploaded</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          <strong>${memberName}</strong> uploaded a contribution slip for <strong>${month}</strong>.
        </p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tbody>
              ${formatDetailRow('Member', memberName)}
              ${formatDetailRow('Month', month)}
              ${formatDetailRow('Entered Amount', enteredAmount ? `₹${enteredAmount.toLocaleString('en-IN')}` : undefined)}
              ${formatDetailRow('Detected Amount', detectedAmount ? `₹${detectedAmount.toLocaleString('en-IN')}` : undefined)}
              ${formatDetailRow('Transaction ID', transactionId)}
              ${formatDetailRow('Paid Date', paymentDate)}
              ${formatDetailRow('Paid Time', paymentTime)}
              ${formatDetailRow('From', fromName)}
              ${formatDetailRow('To', toName)}
              ${formatDetailRow('UPI App', upiProvider ? upiProvider.toUpperCase() : undefined)}
            </tbody>
          </table>
        </div>
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 16px;">
            ⚠️ Action Required: Please review and approve the contribution from your admin dashboard.
          </p>
        </div>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://mandal-book.vercel.app'}/admin" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Review Contribution
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Best regards,<br><strong>Mandal-Book Team</strong>
        </p>
      </div>
    </div>
  `;

  return await sendEmail(adminEmail, 'New Contribution Slip Uploaded', html);
}

async function sendOTPEmail(userEmail, userName, otpCode, expiryMinutes) {
  const subject = 'Verify your email address';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Email Verification</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Please use the following verification code to verify your email address:
        </p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
          <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: white; margin: 0; font-family: 'Courier New', monospace;">
            ${otpCode}
          </p>
        </div>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-weight: 600;">
            ⏰ This code will expire in ${expiryMinutes} minutes.
          </p>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          If you did not request this verification code, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Best regards,<br><strong>Mandal-Book Team</strong>
        </p>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
}

async function sendAdminApprovalEmail(adminEmail, userName, userEmail) {
  const title = 'New User Approval Pending';
  const description = `${userName} (${userEmail}) has verified their email and is waiting for admin approval.`;
  return await sendAdminNotification(adminEmail, title, description);
}

async function sendUserApprovalStatusEmail(userEmail, userName, status, remarks = '') {
  const statusCopy =
    status === 'approved'
      ? {
          subject: 'Your account is approved',
          message: 'You can now access all Mandal-Book features.',
          icon: '✅',
          color: '#10b981',
          bgColor: '#d1fae5',
        }
      : {
          subject: 'Your account approval was rejected',
          message: `Please review the remarks and try again.${remarks ? ` Remarks: ${remarks}` : ''}`,
          icon: '❌',
          color: '#ef4444',
          bgColor: '#fee2e2',
        };

  const { subject, message, icon, color, bgColor } = statusCopy;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${icon} ${subject}</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello <strong>${userName}</strong>,</p>
        <div style="background: ${bgColor}; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: ${color}; font-weight: 600; font-size: 16px;">
            ${message}
          </p>
        </div>
        ${status === 'approved' ? `
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://mandal-book.vercel.app'}/login" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Login to Your Account
          </a>
        </div>
        ` : `
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://mandal-book.vercel.app'}/register" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Review & Resubmit
          </a>
        </div>
        `}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          Best regards,<br><strong>Mandal-Book Team</strong>
        </p>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
}

async function sendContributionReminderEmail(userEmail, userName, currentMonth, dayOfMonth) {
  const subject = `Reminder: Contribution for ${currentMonth}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Contribution Reminder</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          This is a friendly reminder that your contribution for <strong>${currentMonth}</strong> is pending.
        </p>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-weight: 600;">
            📅 Today is ${dayOfMonth}${getDaySuffix(dayOfMonth)} of the month
          </p>
          <p style="margin: 10px 0 0 0; color: #92400e;">
            Please submit your contribution slip before the 10th to avoid any delays.
          </p>
        </div>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_API_URL || 'https://mandal-book.vercel.app'}/contributions" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Upload Contribution Slip
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          If you have already submitted your contribution, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          This is an automated reminder. You will receive this email daily from 1st to 10th of each month until your contribution is submitted.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
          Best regards,<br><strong>Mandal-Book Team</strong>
        </p>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

module.exports = {
  sendEmail,
  sendKYCNotification,
  sendContributionNotification,
  sendLoanNotification,
  sendAdminNotification,
  sendAdminContributionUploadEmail,
  sendOTPEmail,
  sendAdminApprovalEmail,
  sendUserApprovalStatusEmail,
  sendContributionReminderEmail,
};


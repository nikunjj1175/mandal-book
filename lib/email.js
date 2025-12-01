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
    },
    rejected: {
      subject: 'KYC Verification Rejected',
      message: 'Your KYC verification has been rejected. Please check the remarks and resubmit.',
    },
    under_review: {
      subject: 'KYC Under Review',
      message: 'Your KYC documents are under review by the admin.',
    },
  };

  const { subject, message } = statusMessages[status] || statusMessages.under_review;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${subject}</h2>
      <p>Hello ${userName},</p>
      <p>${message}</p>
      <p>Please log in to your account to view more details.</p>
      <br>
      <p>Best regards,<br>Group Money Management System</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
}

async function sendContributionNotification(userEmail, userName, status, month) {
  const statusMessages = {
    done: {
      subject: 'Contribution Approved',
      message: `Your contribution for ${month} has been approved by the admin.`,
    },
    rejected: {
      subject: 'Contribution Rejected',
      message: `Your contribution for ${month} has been rejected. Please check the remarks and resubmit.`,
    },
  };

  const { subject, message } = statusMessages[status] || statusMessages.done;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${subject}</h2>
      <p>Hello ${userName},</p>
      <p>${message}</p>
      <p>Please log in to your account to view more details.</p>
      <br>
      <p>Best regards,<br>Group Money Management System</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
}

async function sendLoanNotification(userEmail, userName, status) {
  const statusMessages = {
    approved: {
      subject: 'Loan Request Approved',
      message: 'Your loan request has been approved by the admin.',
    },
    rejected: {
      subject: 'Loan Request Rejected',
      message: 'Your loan request has been rejected. Please check the remarks.',
    },
  };

  const { subject, message } = statusMessages[status] || statusMessages.approved;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${subject}</h2>
      <p>Hello ${userName},</p>
      <p>${message}</p>
      <p>Please log in to your account to view more details.</p>
      <br>
      <p>Best regards,<br>Group Money Management System</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, html);
}

async function sendAdminNotification(adminEmail, title, description) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${title}</h2>
      <p>${description}</p>
      <p>Please log in to your admin dashboard to take action.</p>
      <br>
      <p>Best regards,<br>Group Money Management System</p>
    </div>
  `;

  return await sendEmail(adminEmail, title, html);
}

function formatDetailRow(label, value) {
  if (!value) return '';
  return `<tr>
    <td style="padding:4px 8px;font-weight:600;color:#111827;">${label}</td>
    <td style="padding:4px 8px;color:#374151;">${value}</td>
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
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #111827;">
      <h2 style="color:#0f172a;">New Contribution Slip Uploaded</h2>
      <p>${memberName} uploaded a contribution slip for <strong>${month}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;margin-top:16px;">
        <tbody>
          ${formatDetailRow('Member', memberName)}
          ${formatDetailRow('Month', month)}
          ${formatDetailRow('Entered Amount', enteredAmount ? `₹${enteredAmount}` : undefined)}
          ${formatDetailRow('Detected Amount', detectedAmount ? `₹${detectedAmount}` : undefined)}
          ${formatDetailRow('Transaction ID', transactionId)}
          ${formatDetailRow('Paid Date', paymentDate)}
          ${formatDetailRow('Paid Time', paymentTime)}
          ${formatDetailRow('From', fromName)}
          ${formatDetailRow('To', toName)}
          ${formatDetailRow('UPI App', upiProvider ? upiProvider.toUpperCase() : undefined)}
        </tbody>
      </table>
      <p style="margin-top:16px;">Please review and approve the contribution from your admin dashboard.</p>
    </div>
  `;

  return await sendEmail(adminEmail, 'New Contribution Slip Uploaded', html);
}

async function sendOTPEmail(userEmail, userName, otpCode, expiryMinutes) {
  const subject = 'Verify your email address';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification</h2>
      <p>Hello ${userName},</p>
      <p>Your verification code is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${otpCode}</p>
      <p>This code will expire in ${expiryMinutes} minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <br>
      <p>Best regards,<br>Group Money Management System</p>
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
          message: 'You can now access all Group Money Management features.',
        }
      : {
          subject: 'Your account approval was rejected',
          message: `Please review the remarks and try again.${remarks ? ` Remarks: ${remarks}` : ''}`,
        };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${statusCopy.subject}</h2>
      <p>Hello ${userName},</p>
      <p>${statusCopy.message}</p>
      <p>Login to your account to view more details.</p>
      <br>
      <p>Best regards,<br>Group Money Management System</p>
    </div>
  `;

  return await sendEmail(userEmail, statusCopy.subject, html);
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


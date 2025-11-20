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
};


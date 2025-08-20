import { Resend } from 'resend';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailData) {
  try {
    if (!resend) {
      console.warn('Resend API key not configured, skipping email send');
      return { success: false, error: 'EMAIL_SERVICE_NOT_CONFIGURED' };
    }

    const { data, error } = await resend.emails.send({
      from: 'Mandal Book <noreply@mandalbook.com>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}

export function generateNewUserEmail(userData: { name: string; email: string; role: string }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New User Registration</h2>
      <p>A new user has registered on Mandal Book:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">User Details:</h3>
        <p><strong>Name:</strong> ${userData.name}</p>
        <p><strong>Email:</strong> ${userData.email}</p>
        <p><strong>Role:</strong> ${userData.role}</p>
        <p><strong>Registration Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/admin/users" 
           style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Check Now
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        This is an automated notification from Mandal Book system.
      </p>
    </div>
  `;
}

export function generateContributionNotificationEmail(contributionData: {
  userName: string;
  amount: number;
  period: string;
  utr: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Contribution Submitted</h2>
      <p>A new contribution has been submitted:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Contribution Details:</h3>
        <p><strong>User:</strong> ${contributionData.userName}</p>
        <p><strong>Amount:</strong> ₹${contributionData.amount}</p>
        <p><strong>Period:</strong> ${contributionData.period}</p>
        <p><strong>UTR:</strong> ${contributionData.utr}</p>
        <p><strong>Submission Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/admin/contributions" 
           style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Review Contribution
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        This is an automated notification from Mandal Book system.
      </p>
    </div>
  `;
}






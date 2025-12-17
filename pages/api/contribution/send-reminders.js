import applyCors from '@/lib/cors';
const connectDB = require('../../../lib/mongodb');
const Contribution = require('../../../models/Contribution');
const User = require('../../../models/User');
const { sendContributionReminderEmail } = require('../../../lib/email');
const { handleApiError } = require('../../../lib/utils');

// This endpoint should be protected with a secret token or called only by cron
async function handler(req, res) {
  // Allow CORS for cron jobs
  if (await applyCors(req, res)) {
    return;
  }

  // Allow both GET (for Vercel cron) and POST (for manual testing)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Optional: Add secret token check for security
  // Vercel cron sends authorization header, or can use query param
  const secretToken = req.headers['authorization']?.replace('Bearer ', '') || 
                      req.headers['x-cron-secret'] || 
                      req.query.secret ||
                      req.body?.secret;
  if (process.env.CRON_SECRET && secretToken !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // Connect to MongoDB
    await connectDB();

    // Get current date
    const now = new Date();
    const currentDate = now.getDate();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check if current date is between 1st and 10th
    if (currentDate < 1 || currentDate > 10) {
      return res.status(200).json({
        success: true,
        message: `Not a reminder day. Current date: ${currentDate}. Reminders are sent only from 1st to 10th.`,
        sent: 0,
      });
    }

    // Get all approved members (exclude admin)
    const allUsers = await User.find({
      role: 'member',
      adminApprovalStatus: 'approved',
      emailVerified: true,
    }).select('name email _id');

    if (allUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No approved users found.',
        sent: 0,
      });
    }

    // Get all users who have already submitted contribution for current month
    const usersWithContribution = await Contribution.find({
      month: currentMonth,
      status: { $ne: 'rejected' }, // Include pending and done
    }).select('userId');

    const userIdsWithContribution = new Set(
      usersWithContribution.map((c) => c.userId.toString())
    );

    // Filter users who haven't submitted contribution
    const usersToRemind = allUsers.filter(
      (user) => !userIdsWithContribution.has(user._id.toString())
    );

    if (usersToRemind.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All users have already submitted their contribution for this month.',
        sent: 0,
        totalUsers: allUsers.length,
      });
    }

    // Send reminder emails
    const emailResults = [];
    let successCount = 0;
    let failCount = 0;

    for (const user of usersToRemind) {
      try {
        const result = await sendContributionReminderEmail(
          user.email,
          user.name,
          currentMonth,
          currentDate
        );

        if (result.success) {
          successCount++;
          emailResults.push({
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            status: 'sent',
          });
        } else {
          failCount++;
          emailResults.push({
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            status: 'failed',
            error: result.error,
          });
        }
      } catch (error) {
        failCount++;
        emailResults.push({
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          status: 'error',
          error: error.message,
        });
        console.error(`Failed to send reminder to ${user.email}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Reminder emails sent for ${currentMonth}`,
      date: currentDate,
      month: currentMonth,
      totalUsers: allUsers.length,
      usersWithContribution: usersWithContribution.length,
      usersToRemind: usersToRemind.length,
      sent: successCount,
      failed: failCount,
      results: emailResults,
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    return handleApiError(res, error, 'Failed to send contribution reminders');
  }
}

export default handler;


import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { AuditLogModel } from '@/models/AuditLog';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await connectToDatabase();

  try {
    // Get recent notifications (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const notifications = await AuditLogModel.find({
      createdAt: { $gte: yesterday },
      read: { $ne: true },
      $or: [
        { action: 'user_register' },
        { action: 'contribution_submit' },
        { action: 'contribution_verify' },
        { action: 'contribution_finalize' }
      ]
    })
    .populate('actorUserId', 'name email')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    return NextResponse.json({ ok: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

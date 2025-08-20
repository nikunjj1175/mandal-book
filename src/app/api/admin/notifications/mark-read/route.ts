import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { AuditLogModel } from '@/models/AuditLog';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const { notificationIds } = await request.json();
    
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      await AuditLogModel.updateMany(
        { _id: { $in: notificationIds } },
        { $set: { read: true, readAt: new Date() } }
      );
    } else {
      // Mark all notifications as read
      await AuditLogModel.updateMany(
        { read: { $ne: true } },
        { $set: { read: true, readAt: new Date() } }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ ok: false, error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}






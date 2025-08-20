import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { AuditLogModel } from '@/models/AuditLog';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ ok: false }, { status: 401 });
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const actor = searchParams.get('actor');
  const page = Number(searchParams.get('page') || '1');
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') || '20'));

  const match: Record<string, any> = {};
  if (action) match.action = action;
  if (actor) match.actorUserId = actor;

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    AuditLogModel.find(match)
      .populate('actorUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    AuditLogModel.countDocuments(match)
  ]);

  return NextResponse.json({ ok: true, items, page, pageSize, total });
}



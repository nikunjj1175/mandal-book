import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';
import { AuditLogModel } from '@/models/AuditLog';

const Schema = z.object({ userId: z.string().min(1), status: z.enum(['pending', 'active', 'suspended']) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ ok: false }, { status: 401 });
  const json = await request.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  await connectToDatabase();
  const before: any = await UserModel.findById(parsed.data.userId).lean();
  await UserModel.updateOne({ _id: parsed.data.userId }, { $set: { status: parsed.data.status } });
  const after: any = await UserModel.findById(parsed.data.userId).lean();
  try {
    await AuditLogModel.create({
      actorUserId: (session as any).user?.id || (session as any).user?.sub,
      action: 'user_status',
      targetType: 'User',
      targetId: parsed.data.userId,
      before: { status: before?.status },
      after: { status: after?.status }
    });
  } catch {}
  return NextResponse.json({ ok: true });
}



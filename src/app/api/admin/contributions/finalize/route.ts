import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ContributionModel } from '@/models/Contribution';
import { z } from 'zod';
import { AuditLogModel } from '@/models/AuditLog';

const Schema = z.object({ id: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ ok: false }, { status: 401 });
  const json = await request.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  await connectToDatabase();
  const before: any = await ContributionModel.findById(parsed.data.id).lean();
  if (!before || before.status !== 'verified') return NextResponse.json({ ok: false, error: 'NOT_VERIFIED' }, { status: 400 });
  await ContributionModel.updateOne({ _id: parsed.data.id }, { $set: { finalized: true, finalizedAt: new Date() } });
  const after: any = await ContributionModel.findById(parsed.data.id).lean();
  try {
    await AuditLogModel.create({
      actorUserId: (session as any).user?.id || (session as any).user?.sub,
      action: 'contribution_finalize',
      targetType: 'Contribution',
      targetId: parsed.data.id,
      before: { finalized: before?.finalized },
      after: { finalized: after?.finalized }
    });
  } catch {}
  return NextResponse.json({ ok: true });
}



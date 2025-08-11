import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ContributionModel } from '@/models/Contribution';
import { GroupModel } from '@/models/Group';
import { currentPeriodYYYYMM } from '@/lib/date';

const SubmitSchema = z.object({
  amount: z.number().positive(),
  period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  utr: z.string().min(6).max(40),
  proof: z
    .object({ url: z.string().url(), publicId: z.string().min(1) })
    .optional()
});

async function getOrCreateDefaultGroup() {
  const existing = await GroupModel.findOne({ name: 'Mandal Book' }).lean();
  if (existing) return existing;
  const created = await GroupModel.create({
    name: 'Mandal Book',
    monthlyAmount: 0,
    reminderDayOfMonth: 1,
    sendTime: '09:00',
    timeZone: 'Asia/Kolkata',
    approvalThreshold: 0.6
  });
  return created.toObject();
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const userId = (session as any).user?.id || (session as any).user?.sub;

  const json = await request.json().catch(() => null);
  const parsed = SubmitSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'INVALID_INPUT' }, { status: 400 });

  await connectToDatabase();
  const group = await getOrCreateDefaultGroup();
  const period = parsed.data.period || currentPeriodYYYYMM();

  await ContributionModel.updateOne(
    { userId, groupId: group._id, period },
    {
      $set: {
        amount: parsed.data.amount,
        utr: parsed.data.utr,
        proof: parsed.data.proof,
        status: 'pending'
      }
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, period, status: 'pending' });
}
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ContributionModel } from '@/models/Contribution';
import { GroupModel } from '@/models/Group';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ ok: false }, { status: 401 });
  await connectToDatabase();
  const [items, group] = await Promise.all([
    ContributionModel.find({ status: 'pending' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean(),
    GroupModel.findOne({ name: 'Mandal Book' }).lean()
  ]);
  const monthlyAmount = (group as any)?.monthlyAmount || 0;
  const mapped = items.map((it: any) => ({
    ...it,
    required: monthlyAmount,
    remaining: Math.max(0, monthlyAmount - (it.amount || 0))
  }));
  return NextResponse.json({ ok: true, items: mapped });
}
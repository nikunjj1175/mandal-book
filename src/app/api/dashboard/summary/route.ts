import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ContributionModel } from '@/models/Contribution';

type MonthlyBucket = { period: string; totalAmount: number; contributions: number };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const isAdmin = (session.user as any)?.role === 'admin';
  const userId = (session as any).user?.id || (session as any).user?.sub;

  await connectToDatabase();

  const match: Record<string, any> = { status: 'verified' };
  if (!isAdmin) {
    match.userId = userId;
  }

  const pipeline = [
    { $match: match },
    { $group: { _id: '$period', totalAmount: { $sum: '$amount' }, contributions: { $sum: 1 } } },
    { $project: { _id: 0, period: '$_id', totalAmount: 1, contributions: 1 } },
    { $sort: { period: 1 } }
  ];

  const monthly: MonthlyBucket[] = await ContributionModel.aggregate(pipeline as any);

  const totals = await ContributionModel.aggregate([
    { $match: match },
    { $group: { _id: null, totalAmount: { $sum: '$amount' }, totalCount: { $sum: 1 } } }
  ]);

  const totalAmount = totals?.[0]?.totalAmount || 0;
  const totalCount = totals?.[0]?.totalCount || 0;

  return NextResponse.json({ ok: true, isAdmin, monthly, totalAmount, totalCount });
}



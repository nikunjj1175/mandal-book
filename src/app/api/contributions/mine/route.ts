import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ContributionModel } from '@/models/Contribution';
import { GroupModel } from '@/models/Group';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const userId = (session as any).user?.id || (session as any).user?.sub;
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start'); // YYYY-MM
  const end = searchParams.get('end'); // YYYY-MM
  const status = searchParams.get('status'); // pending|verified|rejected

  await connectToDatabase();
  const match: Record<string, any> = { userId };
  if (start || end) {
    match.period = {} as any;
    if (start) (match.period as any).$gte = start;
    if (end) (match.period as any).$lte = end;
  }
  if (status && ['pending', 'verified', 'rejected'].includes(status)) {
    match.status = status;
  }
  const [list, group] = await Promise.all([
    ContributionModel.find(match).sort({ createdAt: -1 }).lean(),
    GroupModel.findOne({ name: 'Mandal Book' }).lean()
  ]);
  const monthlyAmount = (group as any)?.monthlyAmount || 0;
  const mapped = list.map((c: any) => ({
    ...c,
    required: monthlyAmount,
    remaining: Math.max(0, monthlyAmount - (c.amount || 0))
  }));
  return NextResponse.json({ ok: true, contributions: mapped, monthlyAmount });
}
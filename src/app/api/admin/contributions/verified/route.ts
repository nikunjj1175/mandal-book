import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ContributionModel } from '@/models/Contribution';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ ok: false }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const finalized = searchParams.get('finalized') || 'false'; // true|false|any

  await connectToDatabase();
  const match: Record<string, any> = { status: 'verified' };
  if (finalized !== 'any') {
    match.finalized = finalized === 'true';
  }
  if (start || end) {
    match.period = {} as any;
    if (start) (match.period as any).$gte = start;
    if (end) (match.period as any).$lte = end;
  }

  const items = await ContributionModel.find(match)
    .populate('userId', 'name email')
    .sort({ updatedAt: -1 })
    .lean();
  return NextResponse.json({ ok: true, items });
}



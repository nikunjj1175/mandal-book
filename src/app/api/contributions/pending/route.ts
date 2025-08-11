import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ContributionModel } from '@/models/Contribution';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ ok: false }, { status: 401 });
  await connectToDatabase();
  const items = await ContributionModel.find({ status: 'pending' })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ ok: true, items });
}
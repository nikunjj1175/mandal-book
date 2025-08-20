import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ContributionModel } from '@/models/Contribution';
import { UserModel } from '@/models/User';

function buildMatch(params: URLSearchParams) {
  const match: Record<string, any> = {};
  const start = params.get('start'); // YYYY-MM
  const end = params.get('end'); // YYYY-MM
  if (start || end) {
    match.period = {} as any;
    if (start) (match.period as any).$gte = start;
    if (end) (match.period as any).$lte = end;
  }

  const hasProof = params.get('hasProof'); // 'with' | 'without' | 'any'
  if (hasProof === 'with') {
    match['proof.url'] = { $exists: true, $ne: null };
  } else if (hasProof === 'without') {
    match.$or = [{ proof: { $exists: false } }, { 'proof.url': { $exists: false } }];
  }
  return match;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await connectToDatabase();

  const url = new URL(request.url);
  const match = { status: 'verified', ...buildMatch(url.searchParams) } as any;

  const [membersAll, membersActive] = await Promise.all([
    UserModel.countDocuments({ role: 'member' }),
    UserModel.countDocuments({ role: 'member', status: 'active' })
  ]);

  const totalsAgg = await ContributionModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCount: { $sum: 1 },
        withProof: {
          $sum: {
            $cond: [{ $ifNull: ['$proof.url', false] }, 1, 0]
          }
        },
        users: { $addToSet: '$userId' }
      }
    }
  ]);

  const totalAmount = totalsAgg?.[0]?.totalAmount || 0;
  const totalCount = totalsAgg?.[0]?.totalCount || 0;
  const withProof = totalsAgg?.[0]?.withProof || 0;
  const uniqueContributors = Array.isArray(totalsAgg?.[0]?.users) ? totalsAgg[0].users.length : 0;

  const monthly = await ContributionModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$period',
        totalAmount: { $sum: '$amount' },
        contributions: { $sum: 1 },
        users: { $addToSet: '$userId' },
        withProof: {
          $sum: {
            $cond: [{ $ifNull: ['$proof.url', false] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        period: '$_id',
        totalAmount: 1,
        contributions: 1,
        uniqueUsers: { $size: '$users' },
        withProof: 1
      }
    },
    { $sort: { period: 1 } }
  ]);

  return NextResponse.json({
    ok: true,
    membersAll,
    membersActive,
    uniqueContributors,
    totalAmount,
    totalCount,
    withProof,
    monthly
  });
}



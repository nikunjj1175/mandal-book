import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ ok: false }, { status: 401 });
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all'; // all|pending|active|suspended
  const query = (searchParams.get('query') || '').trim();
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '20')));

  const match: Record<string, any> = {};
  if (status !== 'all') match.status = status;
  if (query) {
    match.$or = [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    UserModel.find(match)
      .select({ name: 1, email: 1, status: 1, role: 1, createdAt: 1, updatedAt: 1 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    UserModel.countDocuments(match)
  ]);

  return NextResponse.json({ ok: true, items, page, pageSize, total });
}









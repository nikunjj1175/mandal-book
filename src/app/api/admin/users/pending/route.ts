import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await connectToDatabase();
  const users = await UserModel.find({ status: 'pending' })
    .select({ name: 1, email: 1, status: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ ok: true, users });
}
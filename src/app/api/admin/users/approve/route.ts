import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';

const Schema = z.object({ userId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ ok: false }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  await connectToDatabase();
  await UserModel.updateOne({ _id: parsed.data.userId }, { $set: { status: 'active' } });
  return NextResponse.json({ ok: true });
}
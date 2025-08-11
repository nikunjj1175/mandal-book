import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ContributionModel } from '@/models/Contribution';
import { z } from 'zod';

const Schema = z.object({ id: z.string(), action: z.enum(['verify', 'reject']) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') return NextResponse.json({ ok: false }, { status: 401 });
  const json = await request.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  await connectToDatabase();
  const status = parsed.data.action === 'verify' ? 'verified' : 'rejected';
  await ContributionModel.updateOne({ _id: parsed.data.id }, { $set: { status } });
  return NextResponse.json({ ok: true });
}
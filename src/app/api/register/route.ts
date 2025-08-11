import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100)
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'INVALID_INPUT' }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  await connectToDatabase();
  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    return NextResponse.json({ ok: false, error: 'EMAIL_IN_USE' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await UserModel.create({ name, email, passwordHash, role: 'member', status: 'pending' });
  return NextResponse.json({ ok: true, status: 'pending' });
}

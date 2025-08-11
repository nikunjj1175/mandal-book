import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const { email, password, name } = await request.json();
  if (!email || !password) return NextResponse.json({ ok: false }, { status: 400 });
  await connectToDatabase();
  const existing = await UserModel.findOne({ email });
  if (existing) return NextResponse.json({ ok: true, id: existing._id });
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await UserModel.create({ email, name: name || 'Admin', passwordHash, role: 'admin', status: 'active' });
  return NextResponse.json({ ok: true, id: admin._id });
}
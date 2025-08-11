import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';
import { encrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const userId = (session as any).user?.id || (session as any).user?.sub;
  const body = await request.json();
  await connectToDatabase();
  const update: any = {
    name: body.name,
    address: body.address,
    bank: body.bank
  };
  if (body.aadhaarNumber) update.aadhaarNumberEncrypted = encrypt(body.aadhaarNumber);
  if (body.panNumber) update.panNumberEncrypted = encrypt(body.panNumber);
  await UserModel.updateOne({ _id: userId }, { $set: update });
  return NextResponse.json({ ok: true });
}
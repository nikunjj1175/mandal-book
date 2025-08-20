import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ContributionModel } from '@/models/Contribution';
import { GroupModel } from '@/models/Group';
import { AuditLogModel } from '@/models/AuditLog';
import { currentPeriodYYYYMM } from '@/lib/date';
import cloudinary from '@/lib/cloudinary';

const SubmitSchema = z.object({
  amount: z.coerce.number().positive(),
  period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  utr: z.string().min(6).max(40),
  proof: z
    .object({ url: z.string().url(), publicId: z.string().min(1) })
    .optional()
});

async function getOrCreateDefaultGroup() {
  const existing = await GroupModel.findOne({ name: 'Mandal Book' }).lean();
  if (existing) return existing;
  const created = await GroupModel.create({
    name: 'Mandal Book',
    monthlyAmount: 0,
    reminderDayOfMonth: 1,
    sendTime: '09:00',
    timeZone: 'Asia/Kolkata',
    approvalThreshold: 0.6
  });
  return created.toObject();
}

function sanitizeFolderName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-\s_]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const userId = (session as any).user?.id || (session as any).user?.sub;
  const userName = (session as any).user?.name || 'user';

  const contentType = request.headers.get('content-type') || '';
  let payload: any = null;
  let uploadedProof: { url: string; publicId: string } | undefined = undefined;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const amount = form.get('amount');
    const period = form.get('period') as string | null;
    const utr = form.get('utr');
    const file = (form.get('file') || form.get('proof')) as File | null;

    if (file && typeof file === 'object') {
      const folder = `mandal-book/users/${sanitizeFolderName(userName)}/contributions`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
      const upload = await cloudinary.uploader.upload(dataUri, { folder });
      uploadedProof = { url: upload.secure_url, publicId: upload.public_id };
    }

    payload = {
      amount: typeof amount === 'string' ? Number(amount) : amount,
      period: period || undefined,
      utr: typeof utr === 'string' ? utr : '',
      proof: uploadedProof
    };
  } else {
    const json = await request.json().catch(() => null);
    payload = json;
  }

  const parsed = SubmitSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'INVALID_INPUT' }, { status: 400 });

  await connectToDatabase();
  const group = await getOrCreateDefaultGroup();
  const period = parsed.data.period || currentPeriodYYYYMM();

  const payment = {
    amount: parsed.data.amount,
    utr: parsed.data.utr,
    proof: parsed.data.proof,
    createdAt: new Date()
  } as any;

  await ContributionModel.updateOne(
    { userId, groupId: group._id, period },
    {
      $setOnInsert: { userId, groupId: group._id, period, amount: 0, status: 'pending' },
      $inc: { amount: parsed.data.amount },
      $push: { payments: payment },
      $set: { utr: parsed.data.utr, proof: parsed.data.proof, status: 'pending' }
    },
    { upsert: true }
  );

  try {
    await AuditLogModel.create({
      actorUserId: userId,
      action: 'contribution_submit',
      targetType: 'Contribution',
      targetId: `${String(group._id)}:${period}`,
      after: { amount: parsed.data.amount, period, utr: parsed.data.utr, proof: parsed.data.proof }
    });
  } catch {}

  return NextResponse.json({ ok: true, period, status: 'pending' });
}
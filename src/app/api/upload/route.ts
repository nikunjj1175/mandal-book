import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: Request) {
  // Placeholder endpoint; in full implementation we'll sign upload params
  return NextResponse.json({ ok: true });
}
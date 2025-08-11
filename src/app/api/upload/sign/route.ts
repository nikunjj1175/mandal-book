import { NextResponse } from 'next/server';
import crypto from 'crypto';

function sign(params: Record<string, string>) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  const toSign = `${sorted}${apiSecret}`;
  return crypto.createHash('sha1').update(toSign).digest('hex');
}

export async function POST(request: Request) {
  const { folder } = await request.json();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { timestamp, folder };
  const signature = sign(params);
  return NextResponse.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature
  });
}
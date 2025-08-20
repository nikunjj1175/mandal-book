import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { GroupModel } from '@/models/Group';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const { monthlyAmount } = await request.json();
    
    // Check if group already exists
    let group = await GroupModel.findOne({ name: 'Mandal Book' });
    
    if (group) {
      // Update existing group
      group.monthlyAmount = monthlyAmount;
      await group.save();
    } else {
      // Create new group
      group = await GroupModel.create({
        name: 'Mandal Book',
        monthlyAmount,
        createdByUserId: (session.user as any).id
      });
    }

    return NextResponse.json({ 
      ok: true, 
      group: {
        _id: group._id,
        name: group.name,
        monthlyAmount: group.monthlyAmount
      }
    });
  } catch (error) {
    console.error('Error setting up group:', error);
    return NextResponse.json({ ok: false, error: 'Failed to setup group' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const group = await GroupModel.findOne({ name: 'Mandal Book' });
    
    return NextResponse.json({ 
      ok: true, 
      group: group ? {
        _id: group._id,
        name: group.name,
        monthlyAmount: group.monthlyAmount
      } : null
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch group' }, { status: 500 });
  }
}






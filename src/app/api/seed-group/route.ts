import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { GroupModel } from '@/models/Group';

export async function POST() {
  await connectToDatabase();
  
  try {
    // Check if group already exists
    const existingGroup = await GroupModel.findOne({ name: 'Mandal Book' });
    
    if (existingGroup) {
      return NextResponse.json({ 
        ok: true, 
        message: 'Group already exists',
        group: {
          name: existingGroup.name,
          monthlyAmount: existingGroup.monthlyAmount
        }
      });
    }
    
    // Create default group
    const group = await GroupModel.create({
      name: 'Mandal Book',
      monthlyAmount: 1000, // Default amount
      reminderDayOfMonth: 1,
      sendTime: '09:00',
      timeZone: 'Asia/Kolkata',
      approvalThreshold: 0.6,
      pauseReminders: false,
      interestRateMonthly: 0
    });
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Default group created successfully',
      group: {
        name: group.name,
        monthlyAmount: group.monthlyAmount
      }
    });
  } catch (error) {
    console.error('Error creating default group:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Failed to create default group' 
    }, { status: 500 });
  }
}






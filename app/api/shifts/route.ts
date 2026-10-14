import { NextResponse } from 'next/server';
import {
  getWeekShifts,
  updateShiftDetails,
  volunteerForShift,
  adminAssignEmployee,
  cancelOrReplaceAssignment,
  requestShiftSwap,
  cancelSwapRequest,
  claimSwapShift,
  formatDate,
  getSundayOfWeek,
} from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let week = searchParams.get('week');
    if (!week) {
      week = formatDate(getSundayOfWeek(new Date()));
    }

    const shifts = await getWeekShifts(week);
    return NextResponse.json({ week, shifts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shiftId, isRequired, startTime, endTime, requiredWorkersCount } = body;
    if (!shiftId) {
      return NextResponse.json({ error: 'מזהה משמרת חסר' }, { status: 400 });
    }

    const updated = await updateShiftDetails(shiftId, {
      isRequired,
      startTime,
      endTime,
      requiredWorkersCount,
    });

    if (!updated) {
      return NextResponse.json({ error: 'משמרת לא נמצאה' }, { status: 404 });
    }

    return NextResponse.json({ shift: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { action, shiftId, employeeId, targetEmployeeId, swapType } = body;

    if (!shiftId || !action) {
      return NextResponse.json({ error: 'פרמטרים חסרים' }, { status: 400 });
    }

    let result: { success: boolean; message: string };

    switch (action) {
      case 'volunteer':
        result = await volunteerForShift(shiftId, employeeId);
        break;
      case 'admin_assign':
        result = await adminAssignEmployee(shiftId, employeeId);
        break;
      case 'cancel':
        result = await cancelOrReplaceAssignment(shiftId, employeeId, 'cancel');
        break;
      case 'found_replacement':
        result = await cancelOrReplaceAssignment(shiftId, employeeId, 'found_replacement');
        break;
      case 'request_swap':
        result = await requestShiftSwap(shiftId, employeeId, swapType || 'giveaway', targetEmployeeId);
        break;
      case 'cancel_swap':
        result = await cancelSwapRequest(shiftId, employeeId);
        break;
      case 'claim_swap':
        result = await claimSwapShift(shiftId, employeeId);
        break;
      default:
        return NextResponse.json({ error: 'פעולה לא מוכרת' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

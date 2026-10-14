import { NextResponse } from 'next/server';
import { getAdminPin, getEmployees } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, pin } = await request.json();
    const cleanName = (name || '').trim();
    const cleanPin = (pin || '').trim();

    if (!cleanName || !cleanPin) {
      return NextResponse.json({ error: 'יש להזין שם וקוד PIN' }, { status: 400 });
    }

    const adminPin = await getAdminPin();
    if ((cleanName.toLowerCase() === 'מנהל' || cleanName.toLowerCase() === 'admin') && cleanPin === adminPin) {
      return NextResponse.json({
        user: {
          id: 'admin',
          name: 'מנהל מערכת',
          role: 'admin',
          store2ShiftCount: 0,
        },
      });
    }

    const employees = await getEmployees();
    const employee = employees.find(
      (e) => e.name.toLowerCase() === cleanName.toLowerCase() && e.pin === cleanPin
    );

    if (employee) {
      return NextResponse.json({
        user: {
          id: employee.id,
          name: employee.name,
          role: 'employee',
          store2ShiftCount: employee.store2ShiftCount,
        },
      });
    }

    return NextResponse.json({ error: 'שם משתמש או קוד PIN שגויים' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'שגיאת שרת' }, { status: 500 });
  }
}

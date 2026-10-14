import { NextResponse } from 'next/server';
import { getEmployees, addEmployee, deleteEmployee, updateEmployee, toggleEmployeeLeave } from '@/lib/db';

export async function GET() {
  try {
    const employees = await getEmployees();
    // Security: never expose employee PINs to client GET requests
    const safeEmployees = employees.map(({ pin, ...safe }) => safe);
    return NextResponse.json({ employees: safeEmployees });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'שם עובד הוא שדה חובה' }, { status: 400 });
    }

    const newEmp = await addEmployee(name);
    const { pin: _pin, ...safeNewEmp } = newEmp;
    return NextResponse.json({ employee: safeNewEmp, message: 'העובד נוסף בהצלחה עם PIN ברירת מחדל: 123456' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, pin, store2ShiftCount, onLeave, action, alignOnReturn } = body;
    if (!id) {
      return NextResponse.json({ error: 'מזהה עובד חסר' }, { status: 400 });
    }

    if (action === 'toggle_leave') {
      const result = await toggleEmployeeLeave(id, alignOnReturn !== false);
      if (!result) {
        return NextResponse.json({ error: 'עובד לא נמצא' }, { status: 404 });
      }
      const msg = result.employee.onLeave
        ? `${result.employee.name} הוגדר/ה כעת בסטטוס חופשה 🏖️ (לא ישובץ אוטומטית)`
        : result.aligned
        ? `${result.employee.name} חזר/ה מחופשה והמונה יושר ל-${result.newCount} משמרות! 🎯`
        : `${result.employee.name} חזר/ה לפעילות רגילה!`;
      const { pin: _p, ...safeEmp } = result.employee;
      return NextResponse.json({ employee: safeEmp, message: msg });
    }

    const updated = await updateEmployee(id, { name, pin, store2ShiftCount, onLeave });
    if (!updated) {
      return NextResponse.json({ error: 'עובד לא נמצא' }, { status: 404 });
    }

    const { pin: _up, ...safeUpdated } = updated;
    return NextResponse.json({ employee: safeUpdated, message: 'הפרטים עודכנו בהצלחה' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'מזהה עובד חסר' }, { status: 400 });
    }

    const ok = await deleteEmployee(id);
    return NextResponse.json({ success: ok, message: ok ? 'העובד הוסר בהצלחה' : 'עובד לא נמצא' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

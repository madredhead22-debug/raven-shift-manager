import { NextResponse } from 'next/server';
import {
  autoAssignWeek,
  normalizeShiftCounts,
  generateWhatsAppOpenShifts,
  generateWhatsAppWeeklySummary,
  getRecentCompletedShifts,
  formatDate,
  getSundayOfWeek,
} from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, week } = body;

    const targetWeek = week || formatDate(getSundayOfWeek(new Date()));

    if (action === 'auto_assign') {
      const result = await autoAssignWeek(targetWeek);
      return NextResponse.json(result);
    }

    if (action === 'normalize') {
      const result = await normalizeShiftCounts();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'פעולה לא מוכרת' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const week = searchParams.get('week') || formatDate(getSundayOfWeek(new Date()));

    if (action === 'whatsapp_open') {
      const text = await generateWhatsAppOpenShifts(week);
      return NextResponse.json({ text });
    }

    if (action === 'whatsapp_summary') {
      const text = await generateWhatsAppWeeklySummary(week);
      return NextResponse.json({ text });
    }

    if (action === 'recent_shifts') {
      const recentShifts = await getRecentCompletedShifts();
      return NextResponse.json({ recentShifts });
    }

    return NextResponse.json({ error: 'פעולה לא מוכרת' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

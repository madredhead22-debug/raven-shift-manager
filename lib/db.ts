import fs from 'fs/promises';
import path from 'path';
import { Employee, ShiftSlot, ShiftType, PendingSwap, RecentShiftRecord } from './types';

interface DatabaseSchema {
  adminPin: string;
  employees: Employee[];
  shifts: Record<string, ShiftSlot>; // key: shiftId
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_SHIFTS_CONFIG: { type: ShiftType; name: string; start: string; end: string }[] = [
  { type: 'morning', name: 'בוקר', start: '08:00', end: '15:00' },
  { type: 'afternoon', name: 'צהריים', start: '15:00', end: '22:00' },
  { type: 'night', name: 'לילה', start: '22:00', end: '06:00' },
];

const INITIAL_DB: DatabaseSchema = {
  adminPin: '590590',
  employees: [
    {
      id: 'emp-1',
      name: 'יוסי',
      pin: '123456',
      role: 'employee',
      store2ShiftCount: 3,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'emp-2',
      name: 'דניאל',
      pin: '123456',
      role: 'employee',
      store2ShiftCount: 2,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'emp-3',
      name: 'נועה',
      pin: '123456',
      role: 'employee',
      store2ShiftCount: 4,
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'emp-4',
      name: 'שיר',
      pin: '123456',
      role: 'employee',
      store2ShiftCount: 2,
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  shifts: {},
};

async function ensureDataFile(): Promise<DatabaseSchema> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
    return INITIAL_DB;
  }
}

async function writeDataFile(data: DatabaseSchema): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${DB_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tempFile, DB_FILE);
}

export async function getAdminPin(): Promise<string> {
  if (process.env.ADMIN_PIN) return process.env.ADMIN_PIN;
  const db = await ensureDataFile();
  return db.adminPin || '590590';
}

export async function updateAdminPin(newPin: string): Promise<void> {
  const db = await ensureDataFile();
  db.adminPin = newPin;
  await writeDataFile(db);
}

// ==================== EMPLOYEES ====================

export async function getEmployees(): Promise<Employee[]> {
  const db = await ensureDataFile();
  return db.employees.filter((e) => e.active);
}

export async function getAllEmployeesRaw(): Promise<Employee[]> {
  const db = await ensureDataFile();
  return db.employees;
}

export async function addEmployee(name: string): Promise<Employee> {
  const db = await ensureDataFile();
  const trimmed = name.trim();
  const newEmp: Employee = {
    id: `emp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: trimmed,
    pin: '123456', // default initial PIN
    role: 'employee',
    store2ShiftCount: 0,
    active: true,
    createdAt: new Date().toISOString(),
  };
  db.employees.push(newEmp);
  await writeDataFile(db);
  return newEmp;
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const db = await ensureDataFile();
  const emp = db.employees.find((e) => e.id === id);
  if (!emp) return false;
  emp.active = false;
  await writeDataFile(db);
  return true;
}

export async function updateEmployee(
  id: string,
  partial: Partial<Pick<Employee, 'name' | 'pin' | 'store2ShiftCount' | 'onLeave'>>
): Promise<Employee | null> {
  const db = await ensureDataFile();
  const emp = db.employees.find((e) => e.id === id && e.active);
  if (!emp) return null;
  if (partial.name !== undefined) emp.name = partial.name.trim();
  if (partial.pin !== undefined) emp.pin = partial.pin.trim();
  if (partial.store2ShiftCount !== undefined) emp.store2ShiftCount = Math.max(0, partial.store2ShiftCount);
  if (partial.onLeave !== undefined) emp.onLeave = partial.onLeave;
  await writeDataFile(db);
  return emp;
}

export async function toggleEmployeeLeave(
  id: string,
  alignOnReturn = true
): Promise<{ employee: Employee; aligned: boolean; newCount: number } | null> {
  const db = await ensureDataFile();
  const emp = db.employees.find((e) => e.id === id && e.active);
  if (!emp) return null;

  const wasOnLeave = !!emp.onLeave;
  emp.onLeave = !wasOnLeave;

  let aligned = false;

  // When returning from leave, align to the lowest count among other active workers
  if (wasOnLeave && alignOnReturn) {
    const otherWorkers = db.employees.filter((e) => e.active && !e.onLeave && e.id !== id);
    if (otherWorkers.length > 0) {
      const minCount = Math.min(...otherWorkers.map((e) => e.store2ShiftCount));
      if (emp.store2ShiftCount !== minCount) {
        emp.store2ShiftCount = minCount;
        aligned = true;
      }
    }
  }

  await writeDataFile(db);
  return { employee: emp, aligned, newCount: emp.store2ShiftCount };
}

// ==================== SHIFTS & CALENDAR ====================

import { formatDate, getSundayOfWeek } from './dateUtils';
export { formatDate, getSundayOfWeek };

// Generate the 7 days of a week starting from a given Sunday string (YYYY-MM-DD)
export async function getWeekShifts(sundayStr: string): Promise<ShiftSlot[]> {
  const db = await ensureDataFile();
  const [year, month, day] = sundayStr.split('-').map(Number);
  const sunday = new Date(year, month - 1, day);

  const weekShifts: ShiftSlot[] = [];
  let dbModified = false;

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(sunday);
    currentDate.setDate(sunday.getDate() + i);
    const dateStr = formatDate(currentDate);

    for (const conf of DEFAULT_SHIFTS_CONFIG) {
      const shiftId = `${dateStr}_${conf.type}`;
      let slot = db.shifts[shiftId];

      if (!slot) {
        slot = {
          id: shiftId,
          date: dateStr,
          dayOfWeek: i,
          shiftType: conf.type,
          name: conf.name,
          startTime: conf.start,
          endTime: conf.end,
          isRequired: false,
          requiredWorkersCount: 1,
          assignedEmployeeIds: [],
          pendingSwap: null,
        };
        db.shifts[shiftId] = slot;
        dbModified = true;
      }
      weekShifts.push(slot);
    }
  }

  if (dbModified) {
    await writeDataFile(db);
  }

  return weekShifts;
}

export async function updateShiftDetails(
  shiftId: string,
  details: {
    isRequired?: boolean;
    startTime?: string;
    endTime?: string;
    requiredWorkersCount?: number;
  }
): Promise<ShiftSlot | null> {
  const db = await ensureDataFile();
  const slot = db.shifts[shiftId];
  if (!slot) return null;

  if (details.isRequired !== undefined) slot.isRequired = details.isRequired;
  if (details.startTime !== undefined) slot.startTime = details.startTime;
  if (details.endTime !== undefined) slot.endTime = details.endTime;
  if (details.requiredWorkersCount !== undefined) {
    slot.requiredWorkersCount = Math.max(1, details.requiredWorkersCount);
  }

  await writeDataFile(db);
  return slot;
}

// Volunteer for a shift
export async function volunteerForShift(shiftId: string, employeeId: string): Promise<{ success: boolean; message: string }> {
  const db = await ensureDataFile();
  const slot = db.shifts[shiftId];
  if (!slot) return { success: false, message: 'המשמרת לא קיימת' };
  if (!slot.isRequired) return { success: false, message: 'משמרת זו אינה נדרשת בחנות 2' };

  if (slot.assignedEmployeeIds.includes(employeeId)) {
    return { success: false, message: 'הינך כבר משובץ למשמרת זו' };
  }

  if (slot.assignedEmployeeIds.length >= slot.requiredWorkersCount) {
    return { success: false, message: 'המשמרת כבר מאוישת במלואה' };
  }

  const emp = db.employees.find((e) => e.id === employeeId && e.active);
  if (!emp) return { success: false, message: 'עובד לא נמצא' };

  slot.assignedEmployeeIds.push(employeeId);
  emp.store2ShiftCount += 1;

  await writeDataFile(db);
  return { success: true, message: 'השתבצת למשמרת בהצלחה!' };
}

// Direct Admin Assign
export async function adminAssignEmployee(shiftId: string, employeeId: string): Promise<{ success: boolean; message: string }> {
  const db = await ensureDataFile();
  const slot = db.shifts[shiftId];
  if (!slot) return { success: false, message: 'משמרת לא קיימת' };

  const emp = db.employees.find((e) => e.id === employeeId && e.active);
  if (!emp) return { success: false, message: 'עובד לא נמצא' };

  if (!slot.assignedEmployeeIds.includes(employeeId)) {
    slot.assignedEmployeeIds.push(employeeId);
    emp.store2ShiftCount += 1;
    await writeDataFile(db);
  }

  return { success: true, message: 'העובד שובץ למשמרת' };
}

// Admin Cancel or "Found Replacement" (unassign without penalizing employee)
export async function cancelOrReplaceAssignment(
  shiftId: string,
  employeeId: string,
  action: 'cancel' | 'found_replacement'
): Promise<{ success: boolean; message: string }> {
  const db = await ensureDataFile();
  const slot = db.shifts[shiftId];
  if (!slot) return { success: false, message: 'משמרת לא קיימת' };

  const emp = db.employees.find((e) => e.id === employeeId);
  const index = slot.assignedEmployeeIds.indexOf(employeeId);
  if (index === -1) return { success: false, message: 'העובד אינו משובץ למשמרת זו' };

  slot.assignedEmployeeIds.splice(index, 1);

  // If found_replacement / canceled: reverse the count increment so it doesn't count towards their shifts
  if (emp && emp.store2ShiftCount > 0) {
    emp.store2ShiftCount -= 1;
  }

  if (slot.pendingSwap && slot.pendingSwap.offeringEmployeeId === employeeId) {
    slot.pendingSwap = null;
  }

  await writeDataFile(db);
  return {
    success: true,
    message: action === 'found_replacement' ? 'סומן "נמצא מחליף" והמשמרת הוסרה ללא חיוב העובד' : 'השיבוץ בוטל',
  };
}

// Request swap (offer for giveaway or direct swap)
export async function requestShiftSwap(
  shiftId: string,
  offeringEmployeeId: string,
  type: 'giveaway' | 'direct',
  targetEmployeeId?: string
): Promise<{ success: boolean; message: string }> {
  const db = await ensureDataFile();
  const slot = db.shifts[shiftId];
  if (!slot) return { success: false, message: 'משמרת לא קיימת' };

  if (!slot.assignedEmployeeIds.includes(offeringEmployeeId)) {
    return { success: false, message: 'אינך משובץ למשמרת זו' };
  }

  slot.pendingSwap = {
    offeringEmployeeId,
    type,
    targetEmployeeId,
    createdAt: new Date().toISOString(),
  };

  await writeDataFile(db);
  return {
    success: true,
    message: type === 'giveaway' ? 'המשמרת הוצעה למסירה (נשארת באחריותך עד שמחליף ייקח אותה)' : 'הבקשה להחלפה ישירה נשלחה',
  };
}

// Cancel swap request
export async function cancelSwapRequest(shiftId: string, employeeId: string): Promise<{ success: boolean; message: string }> {
  const db = await ensureDataFile();
  const slot = db.shifts[shiftId];
  if (!slot || !slot.pendingSwap) return { success: false, message: 'אין בקשת חילוף פעילה' };

  if (slot.pendingSwap.offeringEmployeeId !== employeeId) {
    return { success: false, message: 'אינך בעל הבקשה' };
  }

  slot.pendingSwap = null;
  await writeDataFile(db);
  return { success: true, message: 'בקשת החילוף בוטלה' };
}

// Claim a shift from swap (take over shift)
export async function claimSwapShift(shiftId: string, acceptingEmployeeId: string): Promise<{ success: boolean; message: string }> {
  const db = await ensureDataFile();
  const slot = db.shifts[shiftId];
  if (!slot || !slot.pendingSwap) {
    return { success: false, message: 'אין בקשת החלפה פתוחה למשמרת זו' };
  }

  const { offeringEmployeeId, type, targetEmployeeId } = slot.pendingSwap;

  if (type === 'direct' && targetEmployeeId && targetEmployeeId !== acceptingEmployeeId) {
    return { success: false, message: 'החלפה זו יועדה לעובד ספציפי אחר' };
  }

  if (acceptingEmployeeId === offeringEmployeeId) {
    return { success: false, message: 'לא ניתן לקחת משמרת של עצמך' };
  }

  const offeringEmp = db.employees.find((e) => e.id === offeringEmployeeId);
  const acceptingEmp = db.employees.find((e) => e.id === acceptingEmployeeId && e.active);

  if (!acceptingEmp) return { success: false, message: 'עובד מקבל לא נמצא' };

  // Remove offering employee, add accepting employee
  const idx = slot.assignedEmployeeIds.indexOf(offeringEmployeeId);
  if (idx !== -1) {
    slot.assignedEmployeeIds.splice(idx, 1);
  }
  slot.assignedEmployeeIds.push(acceptingEmployeeId);

  // Update counters: offering decreases by 1, accepting increases by 1
  if (offeringEmp && offeringEmp.store2ShiftCount > 0) {
    offeringEmp.store2ShiftCount -= 1;
  }
  acceptingEmp.store2ShiftCount += 1;

  // Clear swap offer
  slot.pendingSwap = null;

  await writeDataFile(db);
  return { success: true, message: 'המשמרת עברה אליך בהצלחה והמונים עודכנו!' };
}

// ==================== ALGORITHMS ====================

// 1. Automatic fair assignment for a given week
export async function autoAssignWeek(sundayStr: string): Promise<{ assignedCount: number; message: string }> {
  // Ensure shifts are initialized for this week
  await getWeekShifts(sundayStr);

  const db = await ensureDataFile();
  const activeEmployees = db.employees.filter((e) => e.active && !e.onLeave);

  if (activeEmployees.length === 0) {
    return { assignedCount: 0, message: 'אין עובדים פעילים (שאינם בחופשה) במערכת' };
  }

  // Calculate the 7 dates of this week
  const [year, month, day] = sundayStr.split('-').map(Number);
  const sunday = new Date(year, month - 1, day);
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(sunday);
    cur.setDate(sunday.getDate() + i);
    weekDates.push(formatDate(cur));
  }

  // Find all required shifts in this week that have open slots
  const openShifts = Object.values(db.shifts).filter(
    (s) => weekDates.includes(s.date) && s.isRequired && s.assignedEmployeeIds.length < s.requiredWorkersCount
  );

  if (openShifts.length === 0) {
    return {
      assignedCount: 0,
      message: 'אין משמרות פתוחות לשיבוץ בשבוע זה (ודא שסומנו משמרות כנדרשות בלוח השבועי)',
    };
  }

  let assignedCount = 0;

  for (const shift of openShifts) {
    const actualSlot = db.shifts[shift.id];
    if (!actualSlot) continue;

    const slotsNeeded = actualSlot.requiredWorkersCount - actualSlot.assignedEmployeeIds.length;

    for (let slotIdx = 0; slotIdx < slotsNeeded; slotIdx++) {
      // Find candidate employees who:
      // 1. Are not already assigned to this shift
      // 2. Are not already assigned to another shift on the same date
      const eligibleEmployees = activeEmployees.filter((emp) => {
        if (actualSlot.assignedEmployeeIds.includes(emp.id)) return false;

        const hasOtherShiftSameDay = Object.values(db.shifts).some(
          (s) => s.date === actualSlot.date && s.assignedEmployeeIds.includes(emp.id)
        );
        return !hasOtherShiftSameDay;
      });

      let chosen: Employee | undefined;

      if (eligibleEmployees.length > 0) {
        // Sort by store2ShiftCount ascending (fairness: lowest count first)
        eligibleEmployees.sort((a, b) => a.store2ShiftCount - b.store2ShiftCount);
        chosen = eligibleEmployees[0];
      } else {
        // Fallback: allow employees without a shift at this exact slot
        const fallback = activeEmployees.filter((emp) => !actualSlot.assignedEmployeeIds.includes(emp.id));
        if (fallback.length > 0) {
          fallback.sort((a, b) => a.store2ShiftCount - b.store2ShiftCount);
          chosen = fallback[0];
        }
      }

      if (chosen) {
        actualSlot.assignedEmployeeIds.push(chosen.id);
        chosen.store2ShiftCount += 1;
        assignedCount++;
      }
    }
  }

  await writeDataFile(db);
  return { assignedCount, message: `שובצו ${assignedCount} משמרות בהצלחה לפי עקרון השוויון!` };
}

// 2. "כפתור קיזוז" (Normalize / Offset shift counts)
export async function normalizeShiftCounts(): Promise<{ offset: number; message: string }> {
  const db = await ensureDataFile();
  const activeWorkingEmployees = db.employees.filter((e) => e.active && !e.onLeave);

  if (activeWorkingEmployees.length === 0) {
    return { offset: 0, message: 'אין עובדים פעילים במערכת' };
  }

  const counts = activeWorkingEmployees.map((e) => e.store2ShiftCount);
  const minCount = Math.min(...counts);

  if (minCount <= 0) {
    return {
      offset: 0,
      message: 'הנתונים כבר מנורמלים (יש עובד/ים פעילים עם 0 משמרות, אין צורך בקיזוז כרגע)',
    };
  }

  for (const emp of db.employees.filter((e) => e.active)) {
    emp.store2ShiftCount = Math.max(0, emp.store2ShiftCount - minCount);
  }

  await writeDataFile(db);
  return {
    offset: minCount,
    message: `בוצע קיזוז בהצלחה! הופחתו ${minCount} משמרות מכל העובדים.`,
  };
}

// ==================== WHATSAPP TEXT GENERATION ====================

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export async function generateWhatsAppOpenShifts(sundayStr: string): Promise<string> {
  const weekShifts = await getWeekShifts(sundayStr);
  const db = await ensureDataFile();

  const unassigned = weekShifts.filter(
    (s) => s.isRequired && s.assignedEmployeeIds.length < s.requiredWorkersCount
  );

  if (unassigned.length === 0) {
    return 'היי צוות, כרגע אין משמרות פתוחות להתנדבות בחנות 2 לשבוע זה.';
  }

  let text = 'היי, כנסו לממשק וראו משמרות חדשות בחנות 2:\n';

  unassigned.forEach((s) => {
    const [, month, day] = s.date.split('-');
    const dayName = HEBREW_DAYS[s.dayOfWeek];
    const missing = s.requiredWorkersCount - s.assignedEmployeeIds.length;
    const workerNote = missing > 1 ? ` (${missing} עובדים נדרשים)` : '';
    text += `• ${dayName} ${day}/${month} - ${s.name} (${s.startTime}-${s.endTime})${workerNote}\n`;
  });

  text += '\nהיכנסו עכשיו והשתבצו!';
  return text;
}

export async function generateWhatsAppWeeklySummary(sundayStr: string): Promise<string> {
  const weekShifts = await getWeekShifts(sundayStr);
  const db = await ensureDataFile();
  const empMap = new Map(db.employees.map((e) => [e.id, e.name]));

  const [y, m, d] = sundayStr.split('-').map(Number);
  const sunday = new Date(y, m - 1, d);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const startFormatted = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}`;
  const endFormatted = `${String(saturday.getDate()).padStart(2, '0')}/${String(saturday.getMonth() + 1).padStart(2, '0')}`;

  let text = `📋 סיכום משמרות חנות 2 לשבוע ${startFormatted} - ${endFormatted}:\n\n`;

  const requiredShifts = weekShifts.filter((s) => s.isRequired);

  if (requiredShifts.length === 0) {
    return `אין משמרות שנדרשו בחנות 2 לשבוע ${startFormatted} - ${endFormatted}.`;
  }

  requiredShifts.forEach((s) => {
    const [, month, day] = s.date.split('-');
    const dayName = HEBREW_DAYS[s.dayOfWeek];
    const workers = s.assignedEmployeeIds.map((id) => empMap.get(id) || 'לא ידוע').join(', ');
    const displayWorkers = workers || '❌ טרם שובץ';

    text += `• ${dayName} ${day}/${month} - ${s.name} - ${displayWorkers}\n`;
  });

  return text;
}

// 3. Get Recent Completed Shifts (Last employee and the one before them)
export async function getRecentCompletedShifts(): Promise<RecentShiftRecord[]> {
  const db = await ensureDataFile();
  const empMap = new Map(db.employees.map((e) => [e.id, e.name]));

  const shiftOrder: Record<string, number> = { night: 3, afternoon: 2, morning: 1, custom: 0 };

  const assignedShifts = Object.values(db.shifts)
    .filter((s) => s.assignedEmployeeIds && s.assignedEmployeeIds.length > 0)
    .sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return (shiftOrder[b.shiftType] || 0) - (shiftOrder[a.shiftType] || 0);
    });

  const records: RecentShiftRecord[] = [];
  for (const shift of assignedShifts) {
    for (const empId of shift.assignedEmployeeIds) {
      records.push({
        employeeId: empId,
        employeeName: empMap.get(empId) || 'עובד',
        date: shift.date,
        dayOfWeek: shift.dayOfWeek,
        shiftName: shift.name,
        shiftType: shift.shiftType,
        isLatest: records.length === 0,
      });
      if (records.length >= 5) break;
    }
    if (records.length >= 5) break;
  }

  // If no assigned shifts in db.shifts yet, create initial realistic historical records
  if (records.length === 0 && db.employees.length >= 2) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 2);

    return [
      {
        employeeId: db.employees[2]?.id || 'emp-3',
        employeeName: db.employees[2]?.name || 'נועה',
        date: formatDate(yesterday),
        dayOfWeek: yesterday.getDay(),
        shiftName: 'צהריים',
        shiftType: 'afternoon',
        isLatest: true,
      },
      {
        employeeId: db.employees[0]?.id || 'emp-1',
        employeeName: db.employees[0]?.name || 'יוסי',
        date: formatDate(dayBefore),
        dayOfWeek: dayBefore.getDay(),
        shiftName: 'בוקר',
        shiftType: 'morning',
        isLatest: false,
      },
    ];
  }

  return records;
}


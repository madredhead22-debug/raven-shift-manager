export type Role = 'admin' | 'employee';

export interface Employee {
  id: string;
  name: string;
  pin: string;
  role: Role;
  store2ShiftCount: number;
  active: boolean;
  onLeave?: boolean;
  createdAt: string;
}

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'custom';

export interface PendingSwap {
  offeringEmployeeId: string;
  type: 'giveaway' | 'direct';
  targetEmployeeId?: string; // if direct swap
  createdAt: string;
}

export interface ShiftSlot {
  id: string; // e.g. "2026-10-18_morning"
  date: string; // "YYYY-MM-DD"
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  shiftType: ShiftType;
  name: string; // "בוקר", "צהריים", "לילה"
  startTime: string; // "08:00"
  endTime: string; // "16:00"
  isRequired: boolean; // Marked as required in Store 2
  requiredWorkersCount: number; // default: 1
  assignedEmployeeIds: string[];
  pendingSwap?: PendingSwap | null;
}

export interface WeekSummary {
  startDate: string; // Sunday YYYY-MM-DD
  endDate: string; // Saturday YYYY-MM-DD
  totalRequiredShifts: number;
  totalAssignedShifts: number;
  unassignedShiftsCount: number;
}

export interface RecentShiftRecord {
  employeeId: string;
  employeeName: string;
  date: string;
  dayOfWeek: number;
  shiftName: string;
  shiftType: string;
  isLatest: boolean;
}


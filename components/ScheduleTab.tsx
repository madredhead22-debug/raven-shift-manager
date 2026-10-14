'use client';

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  User,
  UserPlus,
  Check,
  AlertCircle,
  Plus,
  Repeat,
  Trash2,
  UserCheck,
  Sparkles,
  ArrowLeftRight,
} from 'lucide-react';
import { RavenFeather, RavenNestIcon } from './RavenIcons';
import { Employee, ShiftSlot, Role, PendingSwap } from '@/lib/types';
import { formatDate, getSundayOfWeek } from '@/lib/dateUtils';

interface ScheduleTabProps {
  userRole: Role;
  currentUser: { id: string; name: string } | null;
  employees: Employee[];
  shifts: ShiftSlot[];
  currentWeekStart: string;
  onChangeWeek: (newWeekStart: string) => void;
  onRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const HEBREW_DAYS = [
  { name: 'ראשון', short: 'א\'' },
  { name: 'שני', short: 'ב\'' },
  { name: 'שלישי', short: 'ג\'' },
  { name: 'רביעי', short: 'ד\'' },
  { name: 'חמישי', short: 'ה\'' },
  { name: 'שישי', short: 'ו\'' },
  { name: 'שבת', short: 'ש\'' },
];

export default function ScheduleTab({
  userRole,
  currentUser,
  employees,
  shifts,
  currentWeekStart,
  onChangeWeek,
  onRefresh,
  onShowToast,
}: ScheduleTabProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Swap modal state
  const [swapModalShift, setSwapModalShift] = useState<ShiftSlot | null>(null);
  const [swapType, setSwapType] = useState<'giveaway' | 'direct'>('giveaway');
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>('');

  // Calculate week dates
  const [y, m, d] = currentWeekStart.split('-').map(Number);
  const weekStartSunday = new Date(y, m - 1, d);

  const weekDays = HEBREW_DAYS.map((dayInfo, idx) => {
    const cur = new Date(weekStartSunday);
    cur.setDate(weekStartSunday.getDate() + idx);
    const dateStr = formatDate(cur);
    const dayShifts = shifts.filter((s) => s.date === dateStr);
    const openCount = dayShifts.filter(
      (s) => s.isRequired && s.assignedEmployeeIds.length < s.requiredWorkersCount
    ).length;
    return {
      ...dayInfo,
      date: cur,
      dateStr,
      dayNumber: cur.getDate(),
      openCount,
    };
  });

  const selectedDay = weekDays[selectedDayIdx] || weekDays[0];
  const shiftsForSelectedDay = shifts.filter((s) => s.date === selectedDay.dateStr);

  // Week navigation
  const handlePrevWeek = () => {
    const prev = new Date(weekStartSunday);
    prev.setDate(weekStartSunday.getDate() - 7);
    onChangeWeek(formatDate(prev));
  };

  const handleNextWeek = () => {
    const next = new Date(weekStartSunday);
    next.setDate(weekStartSunday.getDate() + 7);
    onChangeWeek(formatDate(next));
  };

  const handleCurrentWeek = () => {
    const cur = getSundayOfWeek(new Date());
    onChangeWeek(formatDate(cur));
  };

  // Toggle Shift Required (Manager)
  const handleToggleRequired = async (shift: ShiftSlot) => {
    setLoadingAction(shift.id);
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: shift.id,
          isRequired: !shift.isRequired,
        }),
      });
      if (!res.ok) throw new Error('שגיאה בעדכון משמרת');
      onRefresh();
      onShowToast(
        !shift.isRequired ? 'המשמרת נפתחה לדרישה בחנות 2' : 'המשמרת הוסרה מדרישות חנות 2',
        'info'
      );
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Edit hours (Manager)
  const handleSaveHours = async (shiftId: string) => {
    setLoadingAction(shiftId);
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId,
          startTime: editStartTime,
          endTime: editEndTime,
        }),
      });
      if (!res.ok) throw new Error('שגיאה בעדכון שעות');
      setEditingShiftId(null);
      onRefresh();
      onShowToast('שעות המשמרת עודכנו בהצלחה', 'success');
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Adjust worker count (Manager)
  const handleAdjustWorkerCount = async (shift: ShiftSlot, delta: number) => {
    const newCount = Math.max(1, shift.requiredWorkersCount + delta);
    setLoadingAction(shift.id);
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: shift.id,
          requiredWorkersCount: newCount,
        }),
      });
      if (!res.ok) throw new Error('שגיאה בעדכון תקן עובדים');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Volunteer (Employee)
  const handleVolunteer = async (shiftId: string) => {
    if (!currentUser) return;
    setLoadingAction(shiftId);
    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'volunteer',
          shiftId,
          employeeId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onShowToast(data.message, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Admin Direct Assign
  const handleAdminAssign = async (shiftId: string, empId: string) => {
    if (!empId) return;
    setLoadingAction(shiftId);
    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_assign',
          shiftId,
          employeeId: empId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onShowToast(data.message, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Admin Cancel or "Found Replacement" (unassign without penalty)
  const handleCancelAssignment = async (
    shiftId: string,
    empId: string,
    isReplacementFound: boolean
  ) => {
    const action = isReplacementFound ? 'found_replacement' : 'cancel';
    const confirmMsg = isReplacementFound
      ? 'סימון "נמצא מחליף" יסיר את העובד מהמשמרת ללא חיוב במניין המשמרות שלו. להמשיך?'
      : 'האם לבטל את שיבוץ העובד?';

    if (!confirm(confirmMsg)) return;

    setLoadingAction(shiftId);
    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          shiftId,
          employeeId: empId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onShowToast(data.message, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Auto Assign for this week (Schedule Tab)
  const openShiftsThisWeek = shifts.filter(
    (s) => s.isRequired && s.assignedEmployeeIds.length < s.requiredWorkersCount
  );

  const handleAutoAssignSchedule = async () => {
    if (openShiftsThisWeek.length === 0) {
      onShowToast('אין משמרות פתוחות לשיבוץ בשבוע זה. סמן משמרות כנדרשות תחילה', 'info');
      return;
    }

    if (!confirm(`האם לשבץ אוטומטית ושוויונית את ${openShiftsThisWeek.length} המשמרות הפתוחות בשבוע זה?`)) return;

    setLoadingAction('auto_assign');
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto_assign',
          week: currentWeekStart,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onShowToast(data.message, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Submit Shift Swap Request (Employee)
  const handleRequestSwapSubmit = async () => {
    if (!swapModalShift || !currentUser) return;
    setLoadingAction(swapModalShift.id);
    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_swap',
          shiftId: swapModalShift.id,
          employeeId: currentUser.id,
          swapType,
          targetEmployeeId: swapType === 'direct' ? targetEmployeeId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSwapModalShift(null);
      onShowToast(data.message, 'info');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Cancel Swap Request
  const handleCancelSwap = async (shiftId: string) => {
    if (!currentUser) return;
    setLoadingAction(shiftId);
    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_swap',
          shiftId,
          employeeId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onShowToast(data.message, 'info');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Claim Swap (take shift from peer)
  const handleClaimSwap = async (shiftId: string) => {
    if (!currentUser) return;
    if (
      !confirm('האם לאשר את קבלת המשמרת? המשמרת תעבור אליך והמונה שלך יעודכן.')
    ) {
      return;
    }
    setLoadingAction(shiftId);
    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim_swap',
          shiftId,
          employeeId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onShowToast(data.message, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const empMap = new Map(employees.map((e) => [e.id, e.name]));

  return (
    <div className="p-3.5 space-y-3">
      {/* Week Navigator */}
      <div className="pro-card p-3 flex items-center justify-between">
        <button
          onClick={handleNextWeek}
          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
          title="שבוע הבא"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 ml-1" />
            <span className="text-xs font-bold text-zinc-200 font-mono">
              {weekDays[0].dayNumber}/{weekDays[0].date.getMonth() + 1} -{' '}
              {weekDays[6].dayNumber}/{weekDays[6].date.getMonth() + 1}
            </span>
          </div>
          <button
            onClick={handleCurrentWeek}
            className="text-[10px] text-purple-400 hover:text-purple-300 font-medium mt-0.5 block mx-auto transition-colors"
          >
            חזור לשבוע הנוכחי
          </button>
        </div>

        <button
          onClick={handlePrevWeek}
          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
          title="שבוע קודם"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Manager Fast Actions Bar */}
      {userRole === 'admin' && (
        <div className="bg-[#171522] border border-zinc-800 p-2.5 rounded-xl flex items-center justify-between">
          <div className="text-[11px] text-zinc-400">
            <span>פתוחות השבוע: </span>
            <span className="font-bold font-mono text-zinc-100">{openShiftsThisWeek.length}</span>
          </div>
          <button
            onClick={handleAutoAssignSchedule}
            disabled={loadingAction === 'auto_assign'}
            className="text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:scale-98 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 space-x-reverse disabled:opacity-50"
          >
            <RavenFeather className="w-3.5 h-3.5 ml-1 text-purple-200" />
            <span>שיבוץ שוויוני אוטומטי</span>
          </button>
        </div>
      )}

      {/* Days Tabs (Sunday to Saturday) */}
      <div className="grid grid-cols-7 gap-1 bg-[#111018] p-1 rounded-xl border border-zinc-800/80">
        {weekDays.map((dItem, idx) => {
          const isSelected = selectedDayIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIdx(idx)}
              className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center transition-colors relative ${
                isSelected
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-zinc-400 hover:bg-zinc-800/60 font-medium'
              }`}
            >
              <span className="text-[10px]">{dItem.name}</span>
              <span className="text-xs mt-0.5 font-mono">{dItem.dayNumber}</span>
              {dItem.openCount > 0 && (
                <span
                  className={`w-1 h-1 rounded-full mt-1 ${
                    isSelected ? 'bg-white' : 'bg-amber-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Day Header Title */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-zinc-300">
          יום {selectedDay.name} ({selectedDay.dayNumber}/{selectedDay.date.getMonth() + 1})
        </h3>
        <span className="text-[10px] text-zinc-500">
          {shiftsForSelectedDay.filter((s) => s.isRequired).length} משמרות בחנות 2
        </span>
      </div>

      {/* Shifts List for Selected Day */}
      <div className="space-y-2.5">
        {shiftsForSelectedDay.map((shift) => {
          const isRequired = shift.isRequired;
          const assignedCount = shift.assignedEmployeeIds.length;
          const needed = shift.requiredWorkersCount;
          const isFull = assignedCount >= needed;
          const isMyShift = currentUser && shift.assignedEmployeeIds.includes(currentUser.id);
          const hasSwapOffer = !!shift.pendingSwap;
          const isMySwapOffer = hasSwapOffer && shift.pendingSwap?.offeringEmployeeId === currentUser?.id;

          if (!isRequired) {
            // NOT REQUIRED SHIFT
            return (
              <div
                key={shift.id}
                className="bg-[#111018]/50 border border-dashed border-zinc-800/80 rounded-xl p-3 flex items-center justify-between text-zinc-500 hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-1.5 space-x-reverse">
                    <span className="text-xs font-medium text-zinc-400">{shift.name}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      ({shift.startTime} - {shift.endTime})
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-600">לא נדרשת בחנות 2</span>
                </div>

                {userRole === 'admin' && (
                  <button
                    onClick={() => handleToggleRequired(shift)}
                    disabled={loadingAction === shift.id}
                    className="text-xs font-semibold text-purple-300 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700/80 transition-colors flex items-center space-x-1 space-x-reverse"
                  >
                    <Plus className="w-3 h-3 ml-1" />
                    <span>פתח משמרת</span>
                  </button>
                )}
              </div>
            );
          }

          // REQUIRED SHIFT CARD
          return (
            <div
              key={shift.id}
              className={`pro-card p-3.5 space-y-2.5 transition-colors ${
                isMyShift ? 'border-purple-800/70 bg-[#161324]' : ''
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="font-bold text-xs text-zinc-100">{shift.name}</span>
                    {isFull ? (
                      <span className="text-[9px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 px-2 py-0.2 rounded-md flex items-center">
                        <Check className="w-2.5 h-2.5 ml-0.5" />
                        מאוישת
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/50 px-2 py-0.2 rounded-md">
                        פתוחה ({assignedCount}/{needed})
                      </span>
                    )}

                    {hasSwapOffer && (
                      <span className="text-[9px] font-medium bg-purple-950/60 text-purple-300 border border-purple-800/50 px-2 py-0.2 rounded-md flex items-center">
                        <ArrowLeftRight className="w-2.5 h-2.5 ml-0.5" />
                        ממתינה לחילוף
                      </span>
                    )}
                  </div>

                  {/* Hours */}
                  {editingShiftId === shift.id ? (
                    <div className="flex items-center space-x-1.5 space-x-reverse mt-2">
                      <input
                        type="time"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="text-xs p-1 border border-zinc-700 rounded bg-zinc-900 text-zinc-200"
                      />
                      <span className="text-xs text-zinc-500">-</span>
                      <input
                        type="time"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="text-xs p-1 border border-zinc-700 rounded bg-zinc-900 text-zinc-200"
                      />
                      <button
                        onClick={() => handleSaveHours(shift.id)}
                        className="text-[10px] bg-purple-600 text-white font-semibold px-2 py-1 rounded"
                      >
                        שמור
                      </button>
                      <button
                        onClick={() => setEditingShiftId(null)}
                        className="text-[10px] text-zinc-500 px-1"
                      >
                        ביטול
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 space-x-reverse text-xs text-zinc-400 mt-0.5 font-mono">
                      <Clock className="w-3 h-3 ml-1 text-zinc-500" />
                      <span>
                        {shift.startTime} - {shift.endTime}
                      </span>
                      {userRole === 'admin' && (
                        <button
                          onClick={() => {
                            setEditingShiftId(shift.id);
                            setEditStartTime(shift.startTime);
                            setEditEndTime(shift.endTime);
                          }}
                          className="text-[10px] text-purple-400 hover:underline mr-1 font-sans"
                        >
                          שנה שעות
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Admin controls: Headcount & Remove */}
                {userRole === 'admin' && (
                  <div className="flex items-center space-x-1.5 space-x-reverse">
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
                      <button
                        onClick={() => handleAdjustWorkerCount(shift, -1)}
                        className="w-5 h-5 flex items-center justify-center font-bold text-zinc-400 hover:text-white rounded"
                        title="הפחת עובד"
                      >
                        -
                      </button>
                      <span className="px-1.5 font-mono text-[10px] text-zinc-300 font-semibold" title="תקן עובדים">
                        {needed}ע'
                      </span>
                      <button
                        onClick={() => handleAdjustWorkerCount(shift, 1)}
                        className="w-5 h-5 flex items-center justify-center font-bold text-zinc-400 hover:text-white rounded"
                        title="הוסף עובד לתקן"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggleRequired(shift)}
                      title="הסר משמרת זו מדרישות חנות 2"
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Assigned Employees */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">עובדים משובצים:</span>
                {shift.assignedEmployeeIds.length === 0 ? (
                  <div className="text-xs text-zinc-600 bg-zinc-900/40 border border-zinc-800/60 p-2 rounded-lg text-center">
                    טרם שובצו עובדים
                  </div>
                ) : (
                  shift.assignedEmployeeIds.map((empId) => {
                    const empName = empMap.get(empId) || 'לא ידוע';
                    const isThisEmpMe = currentUser?.id === empId;
                    const isOfferingSwap =
                      shift.pendingSwap && shift.pendingSwap.offeringEmployeeId === empId;

                    return (
                      <div
                        key={empId}
                        className={`p-2 rounded-lg flex items-center justify-between text-xs ${
                          isThisEmpMe
                            ? 'bg-purple-950/40 border border-purple-800/60 text-purple-200'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="w-5 h-5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-semibold flex items-center justify-center">
                            {empName.slice(0, 1)}
                          </span>
                          <div>
                            <span className="font-semibold text-zinc-100">{empName}</span>
                            {isThisEmpMe && (
                              <span className="text-[9px] text-purple-400 mr-1.5 font-medium">
                                (אני)
                              </span>
                            )}
                            {isOfferingSwap && (
                              <span className="text-[9px] text-amber-400 block font-normal">
                                מציע למסירה / חילוף
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1.5 space-x-reverse">
                          {userRole === 'admin' && (
                            <>
                              <button
                                onClick={() => handleCancelAssignment(shift.id, empId, true)}
                                title="נמצא מחליף (הסרה ללא חיוב במניין המשמרות)"
                                className="text-[9px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 px-2 py-0.5 rounded font-semibold transition-colors"
                              >
                                נמצא מחליף
                              </button>
                              <button
                                onClick={() => handleCancelAssignment(shift.id, empId, false)}
                                title="בטל שיבוץ"
                                className="text-[9px] bg-zinc-800 text-zinc-400 hover:text-rose-400 px-2 py-0.5 rounded transition-colors"
                              >
                                בטל
                              </button>
                            </>
                          )}

                          {userRole === 'employee' && isThisEmpMe && (
                            <>
                              {isOfferingSwap ? (
                                <button
                                  onClick={() => handleCancelSwap(shift.id)}
                                  className="text-[9px] bg-rose-950/60 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded font-semibold"
                                >
                                  בטל בקשת חילוף
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSwapModalShift(shift)}
                                  className="text-[9px] bg-purple-600 hover:bg-purple-500 text-white font-semibold px-2 py-0.5 rounded transition-colors flex items-center space-x-0.5 space-x-reverse"
                                >
                                  <ArrowLeftRight className="w-2.5 h-2.5 ml-1" />
                                  <span>בקש חילוף</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pending Swap Banner */}
              {hasSwapOffer && (
                <div className="bg-amber-950/20 border border-amber-800/50 p-2 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300 flex items-center">
                      <ArrowLeftRight className="w-3 h-3 ml-1 text-amber-400" />
                      {isMySwapOffer
                        ? 'הצעת משמרת זו לחילוף'
                        : `${empMap.get(shift.pendingSwap?.offeringEmployeeId || '') || 'עובד'} מציע משמרת זו`}
                    </span>
                    <span className="text-[9px] text-zinc-400">
                      {shift.pendingSwap?.type === 'giveaway' ? 'מסירה למאגר' : 'החלפה ישירה'}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-400">
                    {isMySwapOffer
                      ? 'המשמרת נשארת באחריותך עד שעובד אחר יאשר וייקח אותה בפועל.'
                      : 'באפשרותך לקחת משמרת זו ישירות ולהתעדכן בסידור.'}
                  </p>

                  {userRole === 'employee' && !isMyShift && (
                    <button
                      onClick={() => handleClaimSwap(shift.id)}
                      className="w-full mt-1.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 space-x-reverse"
                    >
                      <UserCheck className="w-3.5 h-3.5 ml-1" />
                      <span>קח משמרת זו במקומו</span>
                    </button>
                  )}
                </div>
              )}

              {/* Action: Volunteer */}
              {!isFull && userRole === 'employee' && !isMyShift && (
                <button
                  onClick={() => handleVolunteer(shift.id)}
                  disabled={loadingAction === shift.id}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 space-x-reverse"
                >
                  <UserPlus className="w-3.5 h-3.5 ml-1" />
                  <span>אני מתנדב למשמרת זו</span>
                </button>
              )}

              {/* Action: Admin assign dropdown */}
              {!isFull && userRole === 'admin' && (
                <div className="pt-2 border-t border-zinc-800/60 flex items-center space-x-2 space-x-reverse">
                  <span className="text-[10px] font-semibold text-zinc-400 whitespace-nowrap">
                    שבץ עובד:
                  </span>
                  <select
                    onChange={(e) => {
                      handleAdminAssign(shift.id, e.target.value);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="flex-1 p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-medium focus:outline-none"
                  >
                    <option value="" disabled className="bg-zinc-900 text-zinc-500">
                      -- בחר עובד לשיבוץ --
                    </option>
                    {employees
                      .filter((e) => !shift.assignedEmployeeIds.includes(e.id))
                      .map((e) => (
                        <option key={e.id} value={e.id} className="bg-zinc-900 text-zinc-200">
                          {e.name} {e.onLeave ? '(בחופשה)' : ''} ({e.store2ShiftCount} משמרות)
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SWAP REQUEST MODAL */}
      {swapModalShift && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="pro-card w-full max-w-sm p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-semibold text-zinc-100 text-xs">בקשת חילוף משמרת</h3>
              <span className="text-[10px] text-zinc-400 font-mono">
                {swapModalShift.name} ({swapModalShift.startTime}-{swapModalShift.endTime})
              </span>
            </div>

            {/* Type selector */}
            <div className="bg-zinc-900 p-1 rounded-lg flex border border-zinc-800">
              <button
                type="button"
                onClick={() => setSwapType('giveaway')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  swapType === 'giveaway' ? 'bg-purple-600 text-white' : 'text-zinc-400'
                }`}
              >
                מסירה למאגר הצוות
              </button>
              <button
                type="button"
                onClick={() => setSwapType('direct')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  swapType === 'direct' ? 'bg-purple-600 text-white' : 'text-zinc-400'
                }`}
              >
                החלפה מול עובד
              </button>
            </div>

            {swapType === 'direct' && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  בחר עובד להחלפה:
                </label>
                <select
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-200 focus:outline-none"
                >
                  <option value="" className="bg-zinc-900">-- בחר עובד --</option>
                  {employees
                    .filter((e) => e.id !== currentUser.id)
                    .map((e) => (
                      <option key={e.id} value={e.id} className="bg-zinc-900">
                        {e.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <p className="text-[10px] text-zinc-400 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
              תזכורת: המשמרת נשארת משובצת על שמך ובאחריותך עד שעובד אחר יאשר וייקח אותה בפועל.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setSwapModalShift(null)}
                className="py-2 bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-semibold text-xs rounded-lg border border-zinc-800"
              >
                ביטול
              </button>
              <button
                onClick={handleRequestSwapSubmit}
                disabled={swapType === 'direct' && !targetEmployeeId}
                className="py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg disabled:opacity-50 transition-colors"
              >
                שלח בקשה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

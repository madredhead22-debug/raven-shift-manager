'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Scale,
  Share2,
  Calendar,
  AlertCircle,
  History,
  Clock,
  ArrowUpRight,
  Palmtree,
  CheckCircle2,
} from 'lucide-react';
import { RavenLogo, RavenFeather, RavenNestIcon } from './RavenIcons';
import { Employee, ShiftSlot, Role, RecentShiftRecord } from '@/lib/types';
import WhatsAppModal from './WhatsAppModal';

interface DashboardTabProps {
  userRole: Role;
  currentUserId: string;
  employees: Employee[];
  shifts: ShiftSlot[];
  recentShifts: RecentShiftRecord[];
  currentWeekStart: string;
  onRefresh: () => void;
  onNavigateToSchedule: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function DashboardTab({
  userRole,
  currentUserId,
  employees,
  shifts,
  recentShifts,
  currentWeekStart,
  onRefresh,
  onNavigateToSchedule,
  onShowToast,
}: DashboardTabProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [modalData, setModalData] = useState<{ title: string; text: string } | null>(null);

  // Metrics
  const requiredShifts = shifts.filter((s) => s.isRequired);
  const unassignedShifts = requiredShifts.filter(
    (s) => s.assignedEmployeeIds.length < s.requiredWorkersCount
  );
  const assignedSlotsCount = requiredShifts.reduce(
    (acc, s) => acc + s.assignedEmployeeIds.length,
    0
  );
  const totalSlotsNeeded = requiredShifts.reduce(
    (acc, s) => acc + s.requiredWorkersCount,
    0
  );

  // Sort employees by shift count ascending for fairness
  const sortedEmployees = [...employees].sort(
    (a, b) => a.store2ShiftCount - b.store2ShiftCount
  );
  const activeSortedEmployees = sortedEmployees.filter((e) => !e.onLeave);
  const minCount = activeSortedEmployees.length > 0 ? activeSortedEmployees[0].store2ShiftCount : 0;

  // Recent 2 shifts
  const lastShiftWorker = recentShifts[0] || null;
  const penultimateShiftWorker = recentShifts[1] || null;

  // Auto Assign
  const handleAutoAssign = async () => {
    if (unassignedShifts.length === 0) {
      onShowToast('אין כרגע משמרות פתוחות לשיבוץ בשבוע זה. סמן משמרות כנדרשות בלוח השבועי', 'info');
      return;
    }

    if (!confirm(`נמצאו ${unassignedShifts.length} משמרות פתוחות. האם להריץ שיבוץ אוטומטי שוויוני לשבוע זה?`)) return;
    setLoadingAction('auto_assign');
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_assign', week: currentWeekStart }),
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

  // Normalize / Offset
  const handleNormalize = async () => {
    if (minCount === 0) {
      onShowToast('הנתונים כבר מנורמלים (קיים עובד פעיל עם 0 משמרות)', 'info');
      return;
    }
    if (
      !confirm(
        `לחיצה על קיזוז תפחית ${minCount} משמרות מכל העובדים (העובד הפעיל עם המינימום יגיע ל-0, וההפרשים יישמרו בדיוק). להמשיך?`
      )
    ) {
      return;
    }

    setLoadingAction('normalize');
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'normalize' }),
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

  // Load WhatsApp Text
  const handleLoadWhatsAppText = async (actionType: 'whatsapp_open' | 'whatsapp_summary') => {
    setLoadingAction(actionType);
    try {
      const res = await fetch(`/api/actions?action=${actionType}&week=${currentWeekStart}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setModalData({
        title: actionType === 'whatsapp_open' ? 'הודעת משמרות פתוחות' : 'סיכום שבועי לוואטסאפ',
        text: data.text,
      });
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="p-4 space-y-3.5">
      {/* Overview Stats Card */}
      <div className="pro-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400">
              <RavenNestIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-100">סטטוס הקן השבועי</h2>
              <p className="text-[10px] text-purple-300/70 font-medium">Ravenest • One team One nest</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md flex items-center space-x-1 space-x-reverse">
            <RavenFeather className="w-2.5 h-2.5 ml-1 text-purple-400" />
            <span>סבב פעיל</span>
          </span>
        </div>

        {/* 3 Metric Tiles */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#171522] border border-zinc-800/80 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-zinc-500 block mb-0.5">נדרשות</span>
            <span className="text-lg font-bold font-mono text-zinc-100">{totalSlotsNeeded}</span>
          </div>

          <div className="bg-[#171522] border border-zinc-800/80 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-zinc-500 block mb-0.5">מאוישות</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{assignedSlotsCount}</span>
          </div>

          <div
            className={`rounded-xl p-2.5 text-center border transition-colors ${
              unassignedShifts.length > 0
                ? 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                : 'bg-[#171522] border-zinc-800/80 text-zinc-400'
            }`}
          >
            <span className="text-[10px] opacity-70 block mb-0.5">פתוחות</span>
            <span className="text-lg font-bold font-mono">{unassignedShifts.length}</span>
          </div>
        </div>
      </div>

      {/* Recent Shifts Tracker Card */}
      <div className="pro-card p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <History className="w-3.5 h-3.5 text-purple-400 ml-1" />
            <h3 className="text-xs font-semibold text-zinc-200">משמרות אחרונות בקן</h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">חנות 2</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Last Worker */}
          <div className="bg-[#171522] border border-zinc-800/90 rounded-xl p-2.5">
            <span className="text-[9px] uppercase tracking-wider text-purple-400/80 block mb-1">
              אחרון שביצע:
            </span>
            {lastShiftWorker ? (
              <div>
                <p className="text-xs font-bold text-zinc-100 mb-0.5">{lastShiftWorker.employeeName}</p>
                <div className="flex items-center space-x-1 space-x-reverse text-[10px] text-zinc-400">
                  <Clock className="w-3 h-3 ml-0.5 text-zinc-500" />
                  <span>
                    {lastShiftWorker.shiftName} ({lastShiftWorker.date.slice(5).replace('-', '/')})
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-zinc-600">טרם תועדו משמרות</p>
            )}
          </div>

          {/* Penultimate Worker */}
          <div className="bg-[#171522] border border-zinc-800/90 rounded-xl p-2.5">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 block mb-1">
              אחד לפניו:
            </span>
            {penultimateShiftWorker ? (
              <div>
                <p className="text-xs font-bold text-zinc-300 mb-0.5">{penultimateShiftWorker.employeeName}</p>
                <div className="flex items-center space-x-1 space-x-reverse text-[10px] text-zinc-400">
                  <Clock className="w-3 h-3 ml-0.5 text-zinc-500" />
                  <span>
                    {penultimateShiftWorker.shiftName} ({penultimateShiftWorker.date.slice(5).replace('-', '/')})
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-zinc-600">טרם תועדו משמרות</p>
            )}
          </div>
        </div>
      </div>

      {/* Unassigned Shifts Alert */}
      {unassignedShifts.length > 0 && (
        <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 ml-1.5" />
            <p className="text-xs text-amber-200">
              <span className="font-semibold">{unassignedShifts.length} משמרות</span> ממתינות לאיוש השבוע
            </p>
          </div>
          <button
            onClick={onNavigateToSchedule}
            className="text-xs font-semibold text-amber-300 hover:text-white px-2.5 py-1 bg-amber-900/40 hover:bg-amber-800/50 rounded-lg transition-colors flex items-center space-x-1 space-x-reverse"
          >
            <span>ללוח</span>
            <ArrowUpRight className="w-3 h-3 mr-0.5" />
          </button>
        </div>
      )}

      {/* Admin Quick Actions */}
      {userRole === 'admin' && (
        <div className="pro-card p-4 space-y-2.5">
          <h3 className="text-xs font-semibold text-zinc-300">פעולות מערכת</h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAutoAssign}
              disabled={loadingAction === 'auto_assign'}
              className="p-3 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white rounded-xl font-semibold text-xs transition-colors flex flex-col items-center justify-center text-center shadow-subtle disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 mb-1 text-purple-200" />
              <span>שיבוץ שוויוני אוטומטי</span>
              <span className="text-[9px] text-purple-200/80 font-normal mt-0.5">לפי סדר מינימום</span>
            </button>

            <button
              onClick={handleNormalize}
              disabled={loadingAction === 'normalize'}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 active:scale-98 border border-zinc-800 text-zinc-300 rounded-xl font-semibold text-xs transition-colors flex flex-col items-center justify-center text-center disabled:opacity-50"
            >
              <Scale className="w-4 h-4 mb-1 text-zinc-400" />
              <span>קיזוז נתונים</span>
              <span className="text-[9px] text-zinc-500 font-normal mt-0.5">
                {minCount > 0 ? `הפחתת ${minCount} מכולם` : 'מנורמל'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
            <button
              onClick={() => handleLoadWhatsAppText('whatsapp_open')}
              disabled={loadingAction === 'whatsapp_open'}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 space-x-reverse"
            >
              <Share2 className="w-3.5 h-3.5 ml-1 text-zinc-400" />
              <span>משמרות פתוחות</span>
            </button>

            <button
              onClick={() => handleLoadWhatsAppText('whatsapp_summary')}
              disabled={loadingAction === 'whatsapp_summary'}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 space-x-reverse"
            >
              <Share2 className="w-3.5 h-3.5 ml-1 text-zinc-400" />
              <span>סיכום שבועי</span>
            </button>
          </div>
        </div>
      )}

      {/* Fairness Ranking Table */}
      <div className="pro-card p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <RavenFeather className="w-3.5 h-3.5 text-purple-400 ml-1" />
            <h3 className="text-xs font-semibold text-zinc-200">מדד שוויון משמרות בקן</h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">מצטבר</span>
        </div>

        {sortedEmployees.length === 0 ? (
          <div className="p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-center space-y-1">
            <RavenNestIcon className="w-6 h-6 mx-auto text-purple-400 mb-1 opacity-70" />
            <p className="text-xs font-semibold text-zinc-300">הקן ממתין לעובדים</p>
            <p className="text-[10px] text-zinc-500">עבור ללשונית "צוות הקן" כדי להוסיף את עובדי החנות הראשונים</p>
          </div>
        ) : (
          <div className="space-y-1.5">
          {sortedEmployees.map((emp, index) => {
            const isLowest = !emp.onLeave && emp.store2ShiftCount === minCount;
            const isMe = emp.id === currentUserId;

            return (
              <div
                key={emp.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isMe
                    ? 'bg-purple-950/30 border-purple-800/60'
                    : 'bg-[#171522] border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="w-5 h-5 rounded-md bg-zinc-800/80 text-zinc-400 text-[10px] font-mono font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <span className="text-xs font-semibold text-zinc-200">{emp.name}</span>
                      {isMe && (
                        <span className="text-[9px] bg-purple-900/60 text-purple-300 px-1.5 rounded font-medium border border-purple-700/50">
                          אני
                        </span>
                      )}
                      {emp.onLeave && (
                        <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 rounded font-medium border border-zinc-700/60 flex items-center space-x-0.5 space-x-reverse">
                          <Palmtree className="w-2.5 h-2.5 ml-0.5" />
                          <span>בחופשה</span>
                        </span>
                      )}
                    </div>
                    {isLowest && (
                      <span className="text-[9px] text-purple-400 block mt-0.5 font-medium">
                        הבא בתור לשיבוץ
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="text-sm font-bold text-zinc-100">{emp.store2ShiftCount}</span>
                  <span className="text-[9px] text-zinc-500 mr-1">משמרות</span>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* WhatsApp Modal */}
      {modalData && (
        <WhatsAppModal
          title={modalData.title}
          text={modalData.text}
          onClose={() => setModalData(null)}
        />
      )}
    </div>
  );
}

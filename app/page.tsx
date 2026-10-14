'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import LoginView from '@/components/LoginView';
import DashboardTab from '@/components/DashboardTab';
import ScheduleTab from '@/components/ScheduleTab';
import TeamTab from '@/components/TeamTab';
import { Employee, ShiftSlot, Role, RecentShiftRecord } from '@/lib/types';
import { formatDate, getSundayOfWeek } from '@/lib/dateUtils';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<{
    id: string;
    name: string;
    role: Role;
    store2ShiftCount?: number;
  } | null>(null);

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'schedule' | 'team'>('dashboard');
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() =>
    formatDate(getSundayOfWeek(new Date()))
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftSlot[]>([]);
  const [recentShifts, setRecentShifts] = useState<RecentShiftRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('store2_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    try {
      localStorage.setItem('store2_user', JSON.stringify(loggedInUser));
    } catch {
      // ignore
    }
    showToast(`ברוך הבא ל-Ravenest, ${loggedInUser.name}! • One team One nest`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('store2_user');
    } catch {
      // ignore
    }
    showToast('התנתקת בהצלחה', 'info');
  };

  // Fetch Employees
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
        if (user && user.role === 'employee') {
          const me = data.employees.find((e: Employee) => e.id === user.id);
          if (me) {
            setUser((prev) => (prev ? { ...prev, store2ShiftCount: me.store2ShiftCount } : null));
          }
        }
      }
    } catch {
      // ignore
    }
  }, [user]);

  // Fetch Shifts
  const fetchShifts = useCallback(async (weekStr: string) => {
    try {
      const res = await fetch(`/api/shifts?week=${weekStr}`);
      const data = await res.json();
      if (data.shifts) {
        setShifts(data.shifts);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch Recent Shifts (Last and penultimate workers)
  const fetchRecentShifts = useCallback(async () => {
    try {
      const res = await fetch('/api/actions?action=recent_shifts');
      const data = await res.json();
      if (data.recentShifts) {
        setRecentShifts(data.recentShifts);
      }
    } catch {
      // ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchShifts(currentWeekStart), fetchRecentShifts()]);
      setLoading(false);
    };
    loadAll();
  }, [currentWeekStart, fetchEmployees, fetchShifts, fetchRecentShifts]);

  // Refresh all
  const handleRefresh = useCallback(() => {
    fetchEmployees();
    fetchShifts(currentWeekStart);
    fetchRecentShifts();
  }, [fetchEmployees, fetchShifts, fetchRecentShifts, currentWeekStart]);

  const unassignedCount = shifts.filter(
    (s) => s.isRequired && s.assignedEmployeeIds.length < s.requiredWorkersCount
  ).length;

  return (
    <>
      <Header user={user} onLogout={handleLogout} />

      {/* Toast Notification (Raven Theme) */}
      {toast && (
        <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-raven-glow flex items-center space-x-2 space-x-reverse text-xs font-bold pointer-events-auto border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-purple-950/95 text-purple-200 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-600/60'
                : 'bg-raven-950/95 text-slate-200 border-purple-800/50'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 ml-1 text-purple-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 ml-1 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 ml-1 text-purple-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-raven-950 text-slate-100">
        {!user ? (
          <LoginView employees={employees} onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardTab
                userRole={user.role}
                currentUserId={user.id}
                employees={employees}
                shifts={shifts}
                recentShifts={recentShifts}
                currentWeekStart={currentWeekStart}
                onRefresh={handleRefresh}
                onNavigateToSchedule={() => setCurrentTab('schedule')}
                onShowToast={showToast}
              />
            )}

            {currentTab === 'schedule' && (
              <ScheduleTab
                userRole={user.role}
                currentUser={user}
                employees={employees}
                shifts={shifts}
                currentWeekStart={currentWeekStart}
                onChangeWeek={(newWeek) => setCurrentWeekStart(newWeek)}
                onRefresh={handleRefresh}
                onShowToast={showToast}
              />
            )}

            {currentTab === 'team' && user.role === 'admin' && (
              <TeamTab
                employees={employees}
                onRefresh={handleRefresh}
                onShowToast={showToast}
              />
            )}

            {/* Bottom Mobile Navigation */}
            <BottomNav
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              role={user.role}
              unassignedCount={unassignedCount}
            />
          </>
        )}
      </main>
    </>
  );
}

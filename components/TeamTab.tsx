'use client';

import React, { useState } from 'react';
import { UserPlus, Users, Trash2, KeyRound, Check, X, Palmtree } from 'lucide-react';
import { Employee } from '@/lib/types';

interface TeamTabProps {
  employees: Employee[];
  onRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function TeamTab({ employees, onRefresh, onShowToast }: TeamTabProps) {
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCount, setEditCount] = useState<number>(0);

  // Add Employee (Name only! PIN defaults to 123456)
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEmployeeName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewEmployeeName('');
      onShowToast(data.message || 'העובד נוסף בהצלחה', 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (emp: Employee) => {
    if (!confirm(`האם להסיר את "${emp.name}" מהמערכת?`)) return;

    try {
      const res = await fetch(`/api/employees?id=${emp.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onShowToast(data.message, 'info');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  // Reset PIN to 123456
  const handleResetPin = async (emp: Employee) => {
    if (!confirm(`האם לאפס את קוד ה-PIN של "${emp.name}" ל-123456?`)) return;

    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emp.id, pin: '123456' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onShowToast(`קוד ה-PIN של ${emp.name} אופס ל-123456`, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  // Save manual shift count edit
  const handleSaveCount = async (empId: string) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: empId, store2ShiftCount: editCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEditingId(null);
      onShowToast('מונה המשמרות עודכן', 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  // Toggle Vacation / Leave
  const handleToggleLeave = async (emp: Employee) => {
    let alignOnReturn = true;
    if (emp.onLeave) {
      alignOnReturn = confirm(
        `האם להחזיר את "${emp.name}" מחופשה וליישר את מונה המשמרות שלו לסבב הנוכחי (למינימום של יתר העובדים) כדי שלא יצטרך להשלים משמרות?`
      );
    } else {
      if (
        !confirm(
          `האם להגדיר את "${emp.name}" בסטטוס חופשה?\nהעובד לא ישובץ אוטומטית עד שתחזיר אותו מחופשה.`
        )
      ) {
        return;
      }
    }

    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: emp.id,
          action: 'toggle_leave',
          alignOnReturn,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onShowToast(data.message, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  return (
    <div className="p-4 space-y-3.5">
      {/* Add New Employee Card */}
      <div className="pro-card p-4">
        <h3 className="text-xs font-semibold text-zinc-200 flex items-center space-x-1.5 space-x-reverse mb-1">
          <UserPlus className="w-3.5 h-3.5 text-zinc-400 ml-1" />
          <span>הוספת עובד חדש</span>
        </h3>
        <p className="text-[10px] text-zinc-500 mb-3">
          הזן שם בלבד. העובד יתווסף עם קוד PIN התחלתי <span className="font-mono text-zinc-300">123456</span>.
        </p>

        <form onSubmit={handleAddEmployee} className="flex space-x-2 space-x-reverse">
          <input
            type="text"
            placeholder="שם עובד..."
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            className="flex-1 p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={loading || !newEmployeeName.trim()}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 active:scale-98 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap"
          >
            {loading ? 'מוסיף...' : 'הוסף'}
          </button>
        </form>
      </div>

      {/* Employees List */}
      <div className="pro-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-zinc-200 flex items-center space-x-1.5 space-x-reverse">
            <Users className="w-3.5 h-3.5 text-zinc-400 ml-1" />
            <span>צוות עובדים ({employees.length})</span>
          </h3>
          <div className="flex items-center space-x-2 space-x-reverse text-[10px] font-mono text-zinc-400">
            <span>פעילים: {employees.filter((e) => !e.onLeave).length}</span>
            {employees.some((e) => e.onLeave) && (
              <span className="text-amber-400">
                • בחופשה: {employees.filter((e) => e.onLeave).length}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                emp.onLeave
                  ? 'bg-zinc-900/40 border-zinc-800/60 opacity-80'
                  : 'bg-[#171522] border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <span className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center font-mono">
                  {emp.name.slice(0, 1)}
                </span>
                <div>
                  <div className="flex items-center space-x-1.5 space-x-reverse">
                    <span className="font-semibold text-xs text-zinc-100">{emp.name}</span>
                    {emp.onLeave && (
                      <span className="text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-1.5 py-0.2 rounded font-medium mr-1 flex items-center space-x-0.5 space-x-reverse">
                        <Palmtree className="w-2.5 h-2.5 ml-0.5 text-zinc-400" />
                        <span>בחופשה</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-[10px] text-zinc-400 font-mono mt-0.5">
                    <span>משמרות:</span>
                    {editingId === emp.id ? (
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <input
                          type="number"
                          min={0}
                          value={editCount}
                          onChange={(e) => setEditCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-10 p-0.5 border border-zinc-700 rounded text-center text-xs font-bold bg-zinc-900 text-zinc-100"
                        />
                        <button
                          onClick={() => handleSaveCount(emp.id)}
                          className="text-emerald-400 p-0.5 hover:bg-zinc-800 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-zinc-500 p-0.5 hover:bg-zinc-800 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <span className="font-semibold text-zinc-200">{emp.store2ShiftCount}</span>
                        <button
                          onClick={() => {
                            setEditingId(emp.id);
                            setEditCount(emp.store2ShiftCount);
                          }}
                          className="text-[9px] text-zinc-500 hover:text-zinc-300 mr-1 font-sans"
                        >
                          (ערוך)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1.5 space-x-reverse">
                {/* Leave Toggle */}
                <button
                  onClick={() => handleToggleLeave(emp)}
                  title={emp.onLeave ? 'חזרה מחופשה (יישור קו לסבב)' : 'הגדר עובד כנמצא בחופשה'}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors flex items-center space-x-1 space-x-reverse border ${
                    emp.onLeave
                      ? 'bg-zinc-800 text-purple-300 border-zinc-700 hover:bg-zinc-700'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Palmtree className="w-3 h-3 ml-1 text-zinc-400" />
                  <span>{emp.onLeave ? 'חזור לסבב' : 'חופשה'}</span>
                </button>

                <button
                  onClick={() => handleResetPin(emp)}
                  title="אפס PIN ל-123456"
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteEmployee(emp)}
                  title="מחק עובד"
                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

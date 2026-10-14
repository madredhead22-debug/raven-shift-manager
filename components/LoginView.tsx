'use client';

import React, { useState } from 'react';
import { Feather, User, Shield, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';
import { Employee } from '@/lib/types';

interface LoginViewProps {
  employees: Employee[];
  onLoginSuccess: (user: any) => void;
}

export default function LoginView({ employees, onLoginSuccess }: LoginViewProps) {
  const [roleMode, setRoleMode] = useState<'employee' | 'admin'>('employee');
  const [selectedName, setSelectedName] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const loginName = roleMode === 'admin' ? 'מנהל' : (selectedName || customName).trim();

    if (!loginName) {
      setError('אנא בחר או הזן את שמך');
      setLoading(false);
      return;
    }

    if (!pin) {
      setError('אנא הזן קוד PIN');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: loginName, pin: pin.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בהתחברות');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-8 bg-[#09090b]">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto mb-3 bg-[#111018] rounded-xl flex items-center justify-center border border-zinc-700/60 shadow-subtle">
          <Feather className="w-6 h-6 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold tracking-widest text-zinc-100 font-mono">
          RAVEN
        </h2>
        <p className="text-xs text-zinc-400 mt-1">מערכת ניהול משמרות • חנות 2</p>
      </div>

      {/* Role Toggle */}
      <div className="bg-[#111018] border border-zinc-800 p-1 rounded-xl flex mb-4">
        <button
          type="button"
          onClick={() => {
            setRoleMode('employee');
            setError(null);
            setPin('');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5 space-x-reverse ${
            roleMode === 'employee'
              ? 'bg-purple-600 text-white shadow-subtle'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <User className="w-3.5 h-3.5 ml-1" />
          <span>כניסת עובד</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRoleMode('admin');
            setError(null);
            setPin('');
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5 space-x-reverse ${
            roleMode === 'admin'
              ? 'bg-purple-600 text-white shadow-subtle'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5 ml-1" />
          <span>כניסת מנהל</span>
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="pro-card p-5 space-y-3.5"
      >
        {error && (
          <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 flex-shrink-0 ml-1.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {roleMode === 'employee' ? (
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">שם עובד:</label>
            <select
              value={selectedName}
              onChange={(e) => {
                setSelectedName(e.target.value);
                setCustomName('');
              }}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-100 focus:outline-none focus:border-purple-500"
            >
              <option value="" className="bg-zinc-900 text-zinc-500">-- בחר עובד מהרשימה --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name} className="bg-zinc-900 text-zinc-100">
                  {emp.name}
                </option>
              ))}
            </select>

            <div className="text-center my-1.5 text-[10px] text-zinc-500">או הזן שם ידנית:</div>

            <input
              type="text"
              placeholder="שם עובד..."
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                setSelectedName('');
              }}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
            />
          </div>
        ) : (
          <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-300">
            כניסה מאובטחת כמנהל מערכת
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            קוד PIN {roleMode === 'employee' ? '(ברירת מחדל: 123456)' : ''}
          </label>
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              maxLength={10}
              placeholder={roleMode === 'employee' ? 'קוד PIN (לדוגמה 123456)' : 'הזן קוד PIN סודי'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-2.5 pr-9 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono tracking-widest text-center text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
            />
            <KeyRound className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 space-x-reverse"
        >
          {loading ? (
            <span>מתחבר...</span>
          ) : (
            <>
              <span>כניסה למערכת</span>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

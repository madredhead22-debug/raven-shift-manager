'use client';

import React from 'react';
import { Feather, LogOut, Shield, User } from 'lucide-react';
import { Role } from '@/lib/types';

interface HeaderProps {
  user: {
    id: string;
    name: string;
    role: Role;
    store2ShiftCount?: number;
  } | null;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#0c0a13]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center space-x-2.5 space-x-reverse">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center">
          <Feather className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <h1 className="font-bold text-xs tracking-widest text-zinc-100 font-mono">RAVEN</h1>
            <span className="text-[10px] text-zinc-500 font-medium">| חנות 2</span>
          </div>
          <p className="text-[10px] text-zinc-400">ניהול ואיזון משמרות</p>
        </div>
      </div>

      {/* User Info & Logout */}
      {user && (
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="text-left">
            <div className="flex items-center space-x-1 space-x-reverse justify-end">
              <span className="text-xs font-semibold text-zinc-200">{user.name}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-medium border ${
                  user.role === 'admin'
                    ? 'bg-purple-950/60 text-purple-300 border-purple-800/50'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700/50'
                }`}
              >
                {user.role === 'admin' ? 'מנהל' : 'עובד'}
              </span>
            </div>
            {user.role === 'employee' && (
              <p className="text-[10px] text-zinc-400">
                משמרות: <span className="font-mono text-zinc-200 font-semibold">{user.store2ShiftCount ?? 0}</span>
              </p>
            )}
          </div>

          <button
            onClick={onLogout}
            title="התנתק"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
}

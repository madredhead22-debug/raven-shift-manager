'use client';

import React from 'react';
import { LogOut, Shield, User } from 'lucide-react';
import { RavenLogo, RavenFeather } from './RavenIcons';
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
    <header className="sticky top-0 z-40 bg-[#090810]/95 backdrop-blur-md border-b border-purple-900/30 px-4 py-2.5 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center space-x-2.5 space-x-reverse">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a1728] to-[#0d0b14] border border-purple-800/40 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.15)]">
          <RavenLogo className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <h1 className="font-extrabold text-sm tracking-wider text-zinc-100 font-mono">
              Ravenest
            </h1>
            <span className="text-[9px] bg-purple-950/80 text-purple-300 border border-purple-800/50 px-1.5 py-0.2 rounded font-medium">
              חנות 2
            </span>
          </div>
          <p className="text-[9.5px] text-purple-300/70 font-medium tracking-wide flex items-center space-x-1 space-x-reverse">
            <RavenFeather className="w-2.5 h-2.5 inline ml-0.5 text-purple-400" />
            <span>One team • One nest</span>
          </p>
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

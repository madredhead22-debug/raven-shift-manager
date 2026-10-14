'use client';

import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { RavenFeather, RavenNestIcon } from './RavenIcons';
import { Role } from '@/lib/types';

interface BottomNavProps {
  currentTab: 'dashboard' | 'schedule' | 'team';
  onTabChange: (tab: 'dashboard' | 'schedule' | 'team') => void;
  role: Role;
  unassignedCount?: number;
}

export default function BottomNav({
  currentTab,
  onTabChange,
  role,
  unassignedCount = 0,
}: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-md bg-[#090810]/95 backdrop-blur-md border-t border-purple-900/40 shadow-elevated flex items-center justify-around py-2 px-3 pointer-events-auto">
        {/* Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors ${
            currentTab === 'dashboard' ? 'text-purple-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            {unassignedCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-zinc-950 text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                {unassignedCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">דשבורד</span>
        </button>

        {/* Schedule */}
        <button
          onClick={() => onTabChange('schedule')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors ${
            currentTab === 'schedule' ? 'text-purple-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <RavenFeather className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">לוח משמרות</span>
        </button>

        {/* Team (Admin) */}
        {role === 'admin' && (
          <button
            onClick={() => onTabChange('team')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors ${
              currentTab === 'team' ? 'text-purple-400 font-semibold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <RavenNestIcon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">צוות הקן</span>
          </button>
        )}
      </div>
    </nav>
  );
}

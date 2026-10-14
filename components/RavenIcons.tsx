'use client';

import React from 'react';

// Raven silhouette with sharp beak, eye, and aerodynamic wings
export function RavenLogo({ className = 'w-8 h-8', size }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
    >
      <defs>
        <linearGradient id="ravenSheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="ravenBeak" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
      </defs>

      {/* Stylized Raven Head & Sharp Curved Beak */}
      <path
        d="M20 18 C26 10, 42 12, 48 20 C54 28, 52 35, 62 38 C53 43, 44 42, 38 41 C36 49, 29 55, 18 56 C24 50, 26 44, 25 38 C20 40, 14 36, 12 30 C10 24, 14 20, 20 18 Z"
        fill="url(#ravenSheen)"
      />

      {/* Piercing Beak Detail */}
      <path
        d="M48 20 C54 28, 52 35, 62 38 C51 40, 44 38, 41 33 Z"
        fill="url(#ravenBeak)"
      />

      {/* Sleek Feather Wing Barbs */}
      <path
        d="M12 30 C16 34, 18 42, 8 48 C14 46, 20 44, 22 40"
        stroke="#e9d5ff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 24 C22 28, 24 36, 15 42"
        stroke="#e9d5ff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Intelligent Raven Eye */}
      <circle cx="36" cy="24" r="2.5" fill="#f5f3ff" />
      <circle cx="36" cy="24" r="1.2" fill="#09090b" />
    </svg>
  );
}

// Detailed Sleek Raven Feather
export function RavenFeather({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Central Quill Spine */}
      <path d="M20 4 L4 20" />
      {/* Upper Feather Vane */}
      <path d="M19 5 C15 3, 9 6, 6 12 C10 11, 14 11, 16 8" />
      {/* Lower Feather Vane */}
      <path d="M13 14 C10 16, 7 17, 5 19 C7 17, 9 14, 11 11" />
      <path d="M16 11 C13 13, 11 13, 9 12" />
      <path d="M11 7 C14 7, 16 6, 18 5" />
    </svg>
  );
}

// Nest & Unity Emblem ("One team One nest")
export function RavenNestIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer Woven Nest Bowl */}
      <path d="M3 13 C3 18, 7 21, 12 21 C17 21, 21 18, 21 13" />
      {/* Intertwined Twigs */}
      <path d="M2 15 C8 17, 16 17, 22 15" />
      <path d="M4 17 C9 19, 15 19, 20 17" />
      {/* Protective Nest Crown Wings */}
      <path d="M7 11 C9 8, 15 8, 17 11" />
      <circle cx="12" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

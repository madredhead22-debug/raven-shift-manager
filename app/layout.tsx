import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ravenest • One team One nest',
  description: 'Ravenest — ניהול ואיזון משמרות חכם • One team One nest',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-start items-center selection:bg-purple-900 selection:text-purple-100">
        <div className="w-full max-w-md min-h-screen bg-[#0c0a13] border-x border-zinc-800/80 shadow-2xl flex flex-col relative pb-20 overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}

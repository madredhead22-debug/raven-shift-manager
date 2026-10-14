'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface WhatsAppModalProps {
  title: string;
  text: string;
  onClose: () => void;
}

export default function WhatsAppModal({ title, text, onClose }: WhatsAppModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="pro-card w-full max-w-sm p-4 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 shadow-elevated">
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 mb-3">
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <Share2 className="w-4 h-4 text-zinc-400 ml-1" />
            <h3 className="font-semibold text-xs text-zinc-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-3.5 bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-sans text-xs leading-relaxed whitespace-pre-wrap text-zinc-300">
          {text}
        </div>

        <div className="space-y-1.5">
          <button
            onClick={handleCopy}
            className={`w-full py-2 rounded-lg font-semibold text-xs flex items-center justify-center space-x-1 space-x-reverse transition-colors ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-subtle'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 ml-1" />
                <span>הועתק ללוח בהצלחה</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 ml-1" />
                <span>העתק טקסט להדבקה בוואטסאפ</span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-semibold text-xs rounded-lg flex items-center justify-center space-x-1 space-x-reverse transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 ml-1 text-zinc-400" />
            <span>פתח ישירות ב-WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}

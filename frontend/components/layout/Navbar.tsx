'use client';

import React from 'react';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            I
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-lg tracking-tight">Inkloom AI</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
              Governance
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Workspace: <strong>Acme Global Corp</strong></span>
        </div>

        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
            JD
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-medium text-slate-900 leading-tight">Jane Doe</p>
            <p className="text-[10px] text-slate-500">Brand Reviewer</p>
          </div>
        </div>
      </div>
    </header>
  );
};

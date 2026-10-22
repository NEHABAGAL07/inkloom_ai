'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Submit Content', href: '/content', icon: '📝' },
  { name: 'Audit Results', href: '/audits', icon: '🔍' },
  { name: 'Review Queue', href: '/reviews', icon: '⚖️' },
  { name: 'Analytics', href: '/analytics', icon: '📈' },
  { name: 'Brand Guidelines', href: '/settings', icon: '⚙️' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <nav className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Platform
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs text-xs text-slate-600">
        <p className="font-semibold text-slate-800">Governance Engine</p>
        <p className="text-[11px] text-slate-500 mt-0.5">v1.0.0 (Contracts Synchronized)</p>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>AI Human-in-Loop</span>
          <span className="text-emerald-600 font-semibold">Active</span>
        </div>
      </div>
    </aside>
  );
};

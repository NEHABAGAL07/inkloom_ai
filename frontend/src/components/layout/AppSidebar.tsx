import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
  FolderKanban,
  ShieldCheck,
  CheckSquare,
  BookOpen,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils/cn';

const navigationItems = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Content Audit', to: '/audit/new', icon: FileCheck2 },
  { name: 'Content Library', to: '/content', icon: FolderKanban },
  { name: 'Audit Results', to: '/audits', icon: ShieldCheck },
  { name: 'Review Queue', to: '/reviews', icon: CheckSquare },
  { name: 'Brand Guidelines', to: '/guidelines', icon: BookOpen },
  { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const AppSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-white block">Inkloom AI</span>
          <span className="text-[10px] uppercase font-semibold text-brand-400 tracking-wider block">
            Brand Governance
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-300'
                  )}
                />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Tenant Info */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300 block">Acme Global Marketing</span>
            <span className="text-[10px] text-slate-500 block">Workspace: Enterprise v2</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="Connected" />
        </div>
      </div>
    </aside>
  );
};

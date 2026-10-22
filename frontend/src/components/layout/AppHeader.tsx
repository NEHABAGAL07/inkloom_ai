import React, { useEffect, useState } from 'react';
import { isMockModeEnabled, setMockModeEnabled, api } from '../../lib/api/client';
import { Database, Server, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export const AppHeader: React.FC = () => {
  const [mockMode, setMockMode] = useState<boolean>(isMockModeEnabled());
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  const checkHealth = async () => {
    try {
      const res = await api.getHealth();
      setBackendHealthy(res.status === 'healthy');
    } catch {
      setBackendHealthy(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const handleMockChange = () => setMockMode(isMockModeEnabled());
    window.addEventListener('mock-mode-changed', handleMockChange);
    return () => window.removeEventListener('mock-mode-changed', handleMockChange);
  }, []);

  const toggleMock = () => {
    const next = !mockMode;
    setMockMode(next);
    setMockModeEnabled(next);
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-white">Brand Governance Console</span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="text-xs text-slate-400 hidden sm:inline">AI Marketing Compliance System</span>
      </div>

      <div className="flex items-center gap-4">
        {/* API Backend status badge */}
        {!mockMode ? (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
              backendHealthy === true
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : backendHealthy === false
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            )}
            title={backendHealthy ? 'Backend live on http://localhost:8000' : 'Backend unreachable'}
          >
            <Server className="w-3.5 h-3.5" />
            <span>{backendHealthy ? 'FastAPI Live' : 'Backend Offline'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 border border-amber-800 text-amber-300">
            <Database className="w-3.5 h-3.5" />
            <span>Mock Mode Active</span>
          </div>
        )}

        {/* Mock Mode Toggle Switch */}
        <button
          onClick={toggleMock}
          className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300 bg-slate-800 hover:bg-slate-700/80 transition-colors"
          title="Toggle between Live FastAPI Backend and Synthetic Mock Data"
        >
          {mockMode ? 'Switch to Live API' : 'Switch to Mock Mode'}
        </button>

        {/* Swagger link */}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="hidden md:inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          title="Open FastAPI Swagger UI"
        >
          <span>Swagger Docs</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </header>
  );
};

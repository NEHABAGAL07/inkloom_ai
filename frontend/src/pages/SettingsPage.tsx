import React, { useEffect, useState } from 'react';
import { api, isMockModeEnabled, setMockModeEnabled } from '../lib/api/client';
import { HealthStatus } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Server, Database, RefreshCw, CheckCircle, Info } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [mockMode, setMockMode] = useState<boolean>(isMockModeEnabled());
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch (err) {
      setHealth(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, [mockMode]);

  const handleToggleMock = (enabled: boolean) => {
    setMockMode(enabled);
    setMockModeEnabled(enabled);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Workspace Settings & API Connectivity"
        description="Configure client environment preferences and verify connectivity to the FastAPI brand governance backend."
      />

      {/* Integration Mode Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-400" />
          <span>Data Adapter Mode</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Inkloom AI supports two operational modes: <strong>Live API Mode</strong> (connecting to FastAPI on <code>http://localhost:8000/api</code>) and <strong>Mock Mode</strong> (utilizing rich synthetic brand data in memory for independent frontend testing).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div
            onClick={() => handleToggleMock(false)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              !mockMode
                ? 'border-brand-500 bg-brand-950/40 text-brand-200 shadow-md shadow-brand-500/10'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-white">Live API Mode (Default)</span>
              {!mockMode && <CheckCircle className="w-4 h-4 text-brand-400" />}
            </div>
            <p className="text-xs text-slate-400">
              Connects directly to the live backend server at <code>http://localhost:8000/api</code> with persistent database transactions.
            </p>
          </div>

          <div
            onClick={() => handleToggleMock(true)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              mockMode
                ? 'border-amber-500 bg-amber-950/40 text-amber-200 shadow-md shadow-amber-500/10'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-white">Mock Demonstration Mode</span>
              {mockMode && <CheckCircle className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-xs text-slate-400">
              Operates self-contained on client synthetic data without requiring a local Python backend process to be running.
            </p>
          </div>
        </div>
      </div>

      {/* Backend Telemetry */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>FastAPI Backend Health Telemetry</span>
          </h2>
          <button
            onClick={checkHealth}
            disabled={isChecking}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Ping Server</span>
          </button>
        </div>

        {health ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Status</span>
              <span className="text-sm font-bold text-emerald-400 capitalize">{health.status}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Version</span>
              <span className="text-sm font-bold text-white font-mono">{health.version}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Database</span>
              <span className="text-sm font-bold text-slate-200 capitalize">{health.database}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Environment</span>
              <span className="text-sm font-bold text-slate-200 capitalize">{health.environment}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs">
            Unable to connect to backend on <code>http://localhost:8000/api/health</code>. Verify that Uvicorn is active.
          </div>
        )}
      </div>

      {/* Workspace Configuration Info */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
        <h2 className="text-base font-semibold text-white">Active Tenant & Workspace Details</h2>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex justify-between py-1.5 border-b border-slate-800/60">
            <span className="text-slate-500">Tenant Identifier:</span>
            <span className="font-mono text-slate-200">org-default-001 (Acme Global)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-800/60">
            <span className="text-slate-500">Active Workspace:</span>
            <span className="font-medium text-slate-200">Corporate Brand Governance v2</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-800/60">
            <span className="text-slate-500">FastAPI API Prefix:</span>
            <span className="font-mono text-slate-200">/api (alias /api/v1)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

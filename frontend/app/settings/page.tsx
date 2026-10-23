'use client';

import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { BrandGuideline } from '../../types/audit';

export default function SettingsPage() {
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([]);

  useEffect(() => {
    async function loadGuidelines() {
      const data = await ApiService.getGuidelines();
      setGuidelines(data);
    }
    loadGuidelines();
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Governance Configuration
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Brand Guidelines & Assets</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure active style guides, certified claims, official color palettes, and terminology rules.
        </p>
      </div>

      {/* Guidelines Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Active Brand Guidelines</h3>
          <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 shadow-xs">
            + New Guideline
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guidelines.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    v{g.version}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2">{g.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{g.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{g.rules_count} rules</span>
                <span className="font-mono text-slate-400">{g.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approved Assets Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Registered Brand Identity Assets</h3>
        <p className="text-xs text-slate-500">Official assets referenced during visual and claim verification audits.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Logo Standard</span>
            <p className="text-sm font-bold text-slate-800 mt-1">Primary Inkloom Wordmark</p>
            <p className="text-xs text-slate-500 mt-0.5">Min clearspace: 0.25x • Min width: 120px</p>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Color Palette</span>
            <p className="text-sm font-bold text-slate-800 mt-1">Core Enterprise Blue</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-5 h-5 rounded-full bg-[#1A365D] border border-slate-300"></span>
              <span className="text-xs font-mono text-slate-600">#1A365D</span>
              <span className="w-5 h-5 rounded-full bg-[#38BDF8] border border-slate-300"></span>
              <span className="text-xs font-mono text-slate-600">#38BDF8</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Certified Claim Registry</span>
            <p className="text-sm font-bold text-slate-800 mt-1">SOC2 Type II Certified</p>
            <p className="text-xs text-slate-500 mt-0.5">Certified through Dec 2027</p>
          </div>
        </div>
      </div>
    </div>
  );
}

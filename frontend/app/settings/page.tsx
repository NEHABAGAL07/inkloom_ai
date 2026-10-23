"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { BrandGuideline, ApprovedAsset } from "@/types";

export default function SettingsPage() {
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([]);
  const [assets, setAssets] = useState<ApprovedAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [gList, aList] = await Promise.all([api.getGuidelines(), api.getAssets()]);
        setGuidelines(gList);
        setAssets(aList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Brand Guidelines & Approved Assets Registry</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure rule definitions, benchmark registries, trademark rules, and approved media assets.
        </p>
      </div>

      {/* Guidelines Section */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Active Brand Guidelines</h2>
            <p className="text-xs text-slate-400">Rules applied during automated AI audit passes</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition">
            + New Guideline
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {guidelines.map((g) => (
            <div
              key={g.id}
              className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
                    v{g.version}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Active
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-2.5">{g.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{g.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>ID: {g.id}</span>
                <button className="text-indigo-400 hover:underline">Edit Rules</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approved Assets Section */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Approved Asset & Benchmark Registry</h2>
            <p className="text-xs text-slate-400">Certified logos, corporate color palettes, and verified promotional claims</p>
          </div>
          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition">
            + Register Asset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {assets.map((a) => (
            <div
              key={a.id}
              className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {a.asset_type.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">Certified</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-2.5">{a.name}</h3>
                {a.asset_type === "color_palette" && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {Object.values(a.specifications).map((hex: any, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                )}
                {a.asset_type === "verified_claim" && (
                  <p className="text-xs text-slate-300 mt-2 bg-slate-950 p-2 rounded border border-slate-800 italic">
                    "{a.specifications.certified_statement}"
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>{a.id}</span>
                <span className="text-slate-400 font-sans">Compliant</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

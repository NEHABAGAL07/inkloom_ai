"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { BrandGuideline, ApprovedAsset } from "@/types";
import { Plus, X, Check, ShieldCheck, Sparkles, BookOpen, Layers } from "lucide-react";

export default function SettingsPage() {
  const [guidelines, setGuidelines] = useState<BrandGuideline[]>([]);
  const [assets, setAssets] = useState<ApprovedAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Guideline Modal State
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
  const [gName, setGName] = useState("");
  const [gDesc, setGDesc] = useState("");
  const [gVersion, setGVersion] = useState("1.0.0");
  const [isSubmittingG, setIsSubmittingG] = useState(false);

  // Asset Modal State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [aName, setAName] = useState("");
  const [aType, setAType] = useState("logo");
  const [aSpec, setASpec] = useState("");
  const [isSubmittingA, setIsSubmittingA] = useState(false);

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

  const handleCreateGuideline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim()) return;
    setIsSubmittingG(true);
    try {
      const created = await api.createGuideline({
        name: gName.trim(),
        description: gDesc.trim(),
        version: gVersion.trim() || "1.0.0",
      });
      setGuidelines((prev) => [created, ...prev]);
      setGName("");
      setGDesc("");
      setGVersion("1.0.0");
      setIsGuidelineModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to create guideline");
    } finally {
      setIsSubmittingG(false);
    }
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aName.trim()) return;
    setIsSubmittingA(true);

    const newAsset: ApprovedAsset = {
      id: `asset_${Date.now()}`,
      organization_id: "active",
      asset_type: aType as any,
      name: aName.trim(),
      specifications: aType === "verified_claim" ? { certified_statement: aSpec } : { details: aSpec },
      is_approved: true,
      created_at: new Date().toISOString(),
    };

    setAssets((prev) => [newAsset, ...prev]);
    setAName("");
    setASpec("");
    setIsAssetModalOpen(false);
    setIsSubmittingA(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Governance Configuration</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Brand Guidelines &amp; Approved Assets Registry</h1>
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
          <button
            onClick={() => setIsGuidelineModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Guideline</span>
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
                <span className="text-emerald-400 text-[11px] font-sans font-semibold">Enforced</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approved Assets Section */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Approved Asset &amp; Benchmark Registry</h2>
            <p className="text-xs text-slate-400">Certified logos, corporate color palettes, and verified promotional claims</p>
          </div>
          <button
            onClick={() => setIsAssetModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register Asset</span>
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
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Certified
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-2.5">{a.name}</h3>
                {a.asset_type === "color_palette" && a.specifications && (
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
                {a.asset_type === "verified_claim" && a.specifications && (
                  <p className="text-xs text-slate-300 mt-2 bg-slate-950 p-2 rounded border border-slate-800 italic">
                    &ldquo;{a.specifications.certified_statement || a.specifications.details}&rdquo;
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

      {/* Modal: New Guideline */}
      {isGuidelineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1424] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsGuidelineModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Brand Policy Creator</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Add Brand Guideline</h3>

            <form onSubmit={handleCreateGuideline} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Guideline Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Social Media Advertising Policy 2026"
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Version
                </label>
                <input
                  type="text"
                  required
                  placeholder="1.0.0"
                  value={gVersion}
                  onChange={(e) => setGVersion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Policy Description / Standard
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the governance mandate, terminology standards, or tone requirements..."
                  value={gDesc}
                  onChange={(e) => setGDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGuidelineModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingG || !gName.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  {isSubmittingG ? "Saving..." : "Create Guideline"}
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Asset */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1424] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAssetModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>Asset Registry</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Register Approved Asset</h3>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Asset Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary Dark Theme Wordmark"
                  value={aName}
                  onChange={(e) => setAName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Asset Type
                </label>
                <select
                  value={aType}
                  onChange={(e) => setAType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="logo">Logo / Wordmark</option>
                  <option value="color_palette">Color Palette</option>
                  <option value="typography">Typography</option>
                  <option value="verified_claim">Verified Promotional Claim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Specification / Statement
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Certified statement or RGB/HEX specifications..."
                  value={aSpec}
                  onChange={(e) => setASpec(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingA || !aName.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  {isSubmittingA ? "Registering..." : "Register Asset"}
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

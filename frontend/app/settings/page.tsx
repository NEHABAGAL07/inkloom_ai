"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/services/api";
import { BrandGuidelineProfile } from "@/types";
import { useAuth } from "@/services/auth-context";
import { BrandGuidelinesManager } from "@/components/guidelines/BrandGuidelinesManager";
import { BrandGuidelinesViewer } from "@/components/guidelines/BrandGuidelinesViewer";

export default function BrandGuidelinesPage() {
  const { activeRole, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<BrandGuidelineProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.getGuidelineProfile();
      setProfile(data);
    } catch (err: any) {
      console.error("Failed to load brand guideline profile:", err);
      setError(err?.message || "Failed to load brand guidelines.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile, activeRole]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-400">
          Loading authoritative brand governance profile...
        </p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-2xl text-rose-300 text-xs">
          <p className="font-bold text-sm text-rose-400 mb-1">Governance Access Error</p>
          <p>{error || "Unable to retrieve brand guidelines."}</p>
        </div>
        <button
          onClick={loadProfile}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Determine manager vs employee view
  const isManager =
    activeRole === "admin" ||
    activeRole === "compliance_officer" ||
    profile.is_manager === true;

  if (isManager) {
    return <BrandGuidelinesManager initialProfile={profile} onRefresh={loadProfile} />;
  }

  return <BrandGuidelinesViewer profile={profile} />;
}

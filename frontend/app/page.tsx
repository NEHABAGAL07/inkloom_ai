"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/services/auth-context";
import { api } from "@/services/api";
import { ContentSubmission, AnalyticsSummary, MemberInfo } from "@/types";
import { LandingView } from "@/components/auth/LandingView";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { DesignerDashboard } from "@/components/dashboards/DesignerDashboard";
import { LegalDashboard } from "@/components/dashboards/LegalDashboard";
import { MarketingDashboard } from "@/components/dashboards/MarketingDashboard";
import { AlertCircle, RefreshCw, Send, BookOpen, Users, ArrowRight, ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  const { isAuthenticated, activeRole, activeOrgId, activeOrgName } = useAuth();
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const [subs, stats] = await Promise.all([
        api.getSubmissions(),
        api.getAnalyticsSummary(),
      ]);
      setSubmissions(subs || []);
      setAnalytics(stats || null);

      if (activeOrgId) {
        const mems = await api.getMembers(activeOrgId).catch(() => []);
        setMembers(mems || []);
      }
    } catch (e: any) {
      console.error("Dashboard data load failure:", e);
      setError(e?.message || "Unable to load governance workspace telemetry.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeOrgId]);

  useEffect(() => {
    loadData();
  }, [loadData, activeRole]);

  // Public Landing Page if user is not logged in
  if (!isAuthenticated) {
    return <LandingView />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin"></div>
        <p className="text-xs text-ink-secondary font-medium">Loading workspace dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="bg-surface border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 shadow-card text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">Workspace Telemetry Error</h2>
            <p className="text-xs text-ink-secondary mt-1">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Dashboard Load</span>
          </button>
        </div>
      </div>
    );
  }

  // Role-Specific Dashboards
  const renderDashboard = () => {
    if (activeRole === "designer") {
      return <DesignerDashboard submissions={submissions} onRefresh={loadData} />;
    }

    if (activeRole === "compliance_officer" || activeRole === "legal" || activeRole === "reviewer") {
      return <LegalDashboard submissions={submissions} onRefresh={loadData} />;
    }

    if (activeRole === "marketing" || activeRole === "creator") {
      return <MarketingDashboard submissions={submissions} onRefresh={loadData} />;
    }

    if (activeRole === "admin") {
      return (
        <ManagerDashboard
          submissions={submissions}
          analytics={analytics}
          members={members}
          onRefresh={loadData}
        />
      );
    }

    // Default / Fallback for unrecognized role
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-bold text-navy mb-2">Restricted Workspace View</h2>
          <p className="text-sm text-ink-secondary mb-4">
            Your current assigned role ({activeRole || "Pending"}) does not have a customized dashboard view for this organization.
          </p>
          <p className="text-xs text-ink-muted">
            Please contact your organization administrator to update your role permissions.
          </p>
        </div>
      </div>
    );
  };

  return renderDashboard();
}

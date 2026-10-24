"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/services/auth-context";
import { api } from "@/services/api";
import { ContentSubmission, AnalyticsSummary, MemberInfo } from "@/types";
import { LandingView } from "@/components/auth/LandingView";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { DesignerDashboard } from "@/components/dashboards/DesignerDashboard";
import { LegalDashboard } from "@/components/dashboards/LegalDashboard";
import { MarketingDashboard } from "@/components/dashboards/MarketingDashboard";

export default function DashboardPage() {
  const { isAuthenticated, activeRole, activeOrgId } = useAuth();
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!isAuthenticated) return;
    try {
      const [subs, stats] = await Promise.all([
        api.getSubmissions(),
        api.getAnalyticsSummary(),
      ]);
      setSubmissions(subs);
      setAnalytics(stats);

      if (activeOrgId) {
        const mems = await api.getMembers(activeOrgId).catch(() => []);
        setMembers(mems);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated, activeOrgId, activeRole]);

  // Public Landing Page if user is not logged in
  if (!isAuthenticated) {
    return <LandingView />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Loading workspace dashboard...</p>
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

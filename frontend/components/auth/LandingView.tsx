"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth-context";
import { ThemeToggle } from "@/services/theme-context";
import {
  Shield,
  Building,
  Scale,
  FileCheck,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Lock,
  Users,
  Compass,
  AlertTriangle,
  ExternalLink,
  UserCheck,
  Palette,
  FileText,
  Mail,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface DepartmentPersona {
  id: string;
  name: string;
  email: string;
  role: string;
  roleTitle: string;
  department: string;
  badgeStyle: string;
  description: string;
  responsibilities: string[];
}

const DEPARTMENT_PERSONAS: DepartmentPersona[] = [
  {
    id: "admin",
    name: "Alex Mercer",
    email: "admin@acmecloud.com",
    role: "admin",
    roleTitle: "Brand Administrator",
    department: "Executive & Admin",
    badgeStyle: "bg-navy/10 text-navy border-navy/20 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    description: "Enterprise brand director managing master guidelines, team memberships, and audit rule configurations.",
    responsibilities: [
      "Brand Guidelines Management & Rollbacks",
      "Team Member Permissions & Invitations",
      "Audit Engine Rule & Scoring Configuration",
      "Executive Brand Governance Overview",
    ],
  },
  {
    id: "marketing",
    name: "Maya Lin",
    email: "marketing@acmecloud.com",
    role: "marketing",
    roleTitle: "Marketing Lead",
    department: "Marketing Department",
    badgeStyle: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    description: "Content strategist submitting marketing copy, campaign headlines, and press materials for governance checks.",
    responsibilities: [
      "Content Submission & Document Ingestion",
      "Real-Time Pre-Publication AI Audits",
      "Tone & Anti-FUD Copy Alignment",
      "Revision & Resubmission Workflow",
    ],
  },
  {
    id: "designer",
    name: "Leo Vance",
    email: "designer@acmecloud.com",
    role: "designer",
    roleTitle: "Senior Brand Designer",
    department: "Design Department",
    badgeStyle: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    description: "Visual identity lead auditing typography, color contrast, logo exclusion zones, and visual media assets.",
    responsibilities: [
      "Visual Standards & WCAG AA Contrast",
      "Logo Clear-space & Palette Tokens",
      "Designer Feedback Checklists",
      "Media Asset Compliance Reviews",
    ],
  },
  {
    id: "compliance",
    name: "Elena Rostova",
    email: "compliance@acmecloud.com",
    role: "compliance_officer",
    roleTitle: "Legal & Regulatory Officer",
    department: "Legal & Compliance",
    badgeStyle: "bg-teal/10 text-teal border-teal/20 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
    description: "Compliance counsel enforcing statutory rules, certified claim citations, and pre-publication approval sign-off.",
    responsibilities: [
      "Pre-Publication Review Queue",
      "Certified Benchmark Claim Verification",
      "Mandatory Legal Disclosure Enforcement",
      "Authorized Human Publication Sign-Off",
    ],
  },
];

export function LandingView() {
  const router = useRouter();
  const { login } = useAuth();
  const [activeSigningIn, setActiveSigningIn] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggedOutNotice, setLoggedOutNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reason") === "logged_out") {
        setLoggedOutNotice(true);
      }
    }
  }, []);

  const handleDepartmentSignIn = async (persona: DepartmentPersona) => {
    setActiveSigningIn(persona.id);
    setAuthError(null);
    try {
      await login(persona.email, "password123");
      router.push("/");
    } catch (err: any) {
      setAuthError(
        err?.message || `Failed to sign in as ${persona.name}. Please ensure the backend is running.`
      );
      setActiveSigningIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-workspace text-ink-primary flex flex-col justify-between selection:bg-teal selection:text-white transition-colors duration-150">
      {/* Top Enterprise Brand Navigation */}
      <header className="bg-navy border-b border-navy-dark px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center shadow-subtle group-hover:bg-teal-hover transition">
              <span className="text-white font-black text-base tracking-tighter">IK</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white tracking-tight">Inkloom AI</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal/20 text-teal-light border border-teal/30">
                  Governance Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Enterprise Brand Integrity &amp; Statutory Compliance</p>
            </div>
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/invite"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition inline-flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-teal-light" />
              <span>Accept Invite</span>
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition inline-flex items-center gap-1.5"
            >
              <Building className="w-3.5 h-3.5 text-teal-light" />
              <span>Register Company</span>
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-bold rounded-lg transition shadow-sm inline-flex items-center gap-1.5"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Public Body */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 lg:py-16 w-full space-y-12">
        {/* Signed Out Notification Banner */}
        {loggedOutNotice && (
          <div className="p-4 rounded-xl bg-teal/10 border border-teal/30 text-teal dark:text-teal-300 flex items-center justify-between shadow-subtle animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal shrink-0" />
              <div className="text-xs">
                <span className="font-bold">Signed out successfully.</span> You have exited your previous workspace session. Choose an authorized department below to sign back in, register a company, or accept an invitation.
              </div>
            </div>
            <button
              onClick={() => setLoggedOutNotice(false)}
              className="text-xs font-semibold hover:underline text-teal dark:text-teal-300 ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Pre-Publication Brand &amp; Legal Compliance Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-navy leading-[1.15]">
            Accountable Brand Standards for the Enterprise
          </h1>

          <p className="text-sm sm:text-base text-ink-secondary leading-relaxed max-w-2xl mx-auto">
            Automated terminology enforcement, factual claim verification, and human-in-the-loop review workflows across marketing, creative, and legal departments.
          </p>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="max-w-2xl mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-subtle">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* 1. PRIMARY FEATURE: Enterprise Department Sign-In (Admin, Marketing, Designer, Legal) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-border pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Department Login</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">
                Select an Enterprise Department to Sign In
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Each department accesses customized workspace views, guideline permissions, and publication controls.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-ink-muted">
              Pre-configured Enterprise Accounts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEPARTMENT_PERSONAS.map((dept) => {
              const isSubmitting = activeSigningIn === dept.id;
              return (
                <div
                  key={dept.id}
                  className="bg-surface rounded-2xl border border-border hover:border-teal/50 shadow-subtle hover:shadow-card transition-all p-5 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Header with badge */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${dept.badgeStyle}`}>
                        {dept.department}
                      </span>
                    </div>

                    {/* Persona info */}
                    <div>
                      <h3 className="text-base font-bold text-navy group-hover:text-teal transition">
                        {dept.roleTitle}
                      </h3>
                      <p className="text-xs font-semibold text-ink-primary mt-0.5">{dept.name}</p>
                      <p className="text-[11px] text-ink-muted font-mono">{dept.email}</p>
                    </div>

                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {dept.description}
                    </p>

                    {/* Responsibilities list */}
                    <div className="space-y-1.5 pt-2 border-t border-border">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        Department Functions:
                      </div>
                      <ul className="space-y-1 text-[11px] text-ink-secondary">
                        {dept.responsibilities.map((resp, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-teal font-bold mt-0.5">•</span>
                            <span className="leading-tight">{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Sign-in Button */}
                  <button
                    type="button"
                    disabled={isSubmitting || !!activeSigningIn}
                    onClick={() => handleDepartmentSignIn(dept)}
                    className="w-full py-2.5 px-3 bg-teal hover:bg-teal-hover disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-subtle transition flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In as {dept.roleTitle.split(" ")[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. SECONDARY ACTIONS: Register Company & Invite Member */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Register Company Card */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-subtle hover:border-teal/40 transition flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
                  New Workspace Setup
                </span>
                <h3 className="text-lg font-bold text-navy mt-0.5">Register a New Company</h3>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Deploy an isolated enterprise workspace for your organization. Includes dedicated guideline versions, multi-tenant database separation, and custom role assignments.
              </p>
            </div>
            <Link
              href="/register"
              className="py-2.5 px-4 bg-navy hover:bg-navy-dark text-white font-semibold text-xs rounded-xl transition inline-flex items-center justify-center gap-2 shadow-subtle self-start"
            >
              <Building className="w-4 h-4 text-teal-light" />
              <span>Register Company Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Accept / Enter Invitation Card */}
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-subtle hover:border-teal/40 transition flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
                  Team Member Access
                </span>
                <h3 className="text-lg font-bold text-navy mt-0.5">Accept Team Invitation</h3>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Received an invitation token or email from your brand administrator? Accept your invite to join your team&apos;s existing brand governance workspace.
              </p>
            </div>
            <Link
              href="/invite"
              className="py-2.5 px-4 bg-surface hover:bg-workspace border border-border text-ink-primary font-semibold text-xs rounded-xl transition inline-flex items-center justify-center gap-2 shadow-subtle self-start"
            >
              <Mail className="w-4 h-4 text-teal" />
              <span>Enter Invitation Token</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Standard Sign In Alternative */}
        <div className="text-center pt-2 pb-4">
          <p className="text-xs text-ink-secondary">
            Already have personalized credentials?{" "}
            <Link
              href="/login"
              className="text-teal hover:text-teal-hover font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Sign in via Workspace Portal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>

        {/* 4 Core Pillars of Enterprise Governance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-border">
          <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy">Automated Content Audits</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Scan draft copy and assets across text, PDF, and visual media for unauthorized buzzwords, tone discrepancies, and unverified claims.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy">Statutory Rule Grounding</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Verify claims against authoritative statutory frameworks including FTC guidelines, FDA advertising rules, and ISO compliance standards.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy">Human Authority Guarantee</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              AI audits detect potential flaws, but only authorized human compliance officers can authorize release for public campaign distribution.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy">Multi-Tenant Isolation</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Enterprise tenant isolation ensures strict database separation, independent guideline versioning, and role-based access for every organization.
            </p>
          </div>
        </div>

        {/* Advisory Notice Banner */}
        <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 text-ink-primary text-xs flex items-start gap-3.5 max-w-4xl mx-auto shadow-subtle">
          <Shield className="w-5 h-5 text-teal shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-navy">Enterprise Compliance Advisory Notice</h4>
            <p className="text-ink-secondary leading-relaxed">
              Inkloom AI provides tools to assist internal review and enforce corporate brand standards. Automated evaluations and suggested revisions do not constitute formal legal counsel. Official publication clearance remains the exclusive responsibility of authorized organization officers.
            </p>
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="bg-surface border-t border-border px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy">Inkloom AI</span>
            <span>&copy; {new Date().getFullYear()} Inkloom Governance Systems. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/register" className="hover:text-ink-primary transition">
              Register Company
            </Link>
            <Link href="/invite" className="hover:text-ink-primary transition">
              Accept Invite
            </Link>
            <Link href="/login" className="hover:text-ink-primary transition">
              Workspace Login
            </Link>
            <Link href="/demo" className="text-teal hover:text-teal-hover font-semibold inline-flex items-center gap-1">
              <span>Full Sandbox</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

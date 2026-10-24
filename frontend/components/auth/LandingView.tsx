"use client";

import React from "react";
import Link from "next/link";
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
} from "lucide-react";

export function LandingView() {
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
              href="/demo"
              className="text-xs font-semibold text-teal-light hover:text-white px-3 py-1.5 rounded-lg bg-teal/20 border border-teal/40 hover:bg-teal/30 transition inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-light" />
              <span>Demo Sandbox</span>
            </Link>
            <Link
              href="/invite"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition hidden sm:inline-flex items-center gap-1.5"
            >
              <span>Accept Invite</span>
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition inline-flex items-center gap-1.5"
            >
              <Building className="w-3.5 h-3.5 text-teal-light" />
              <span>Create Company</span>
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

      {/* Main Public Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 lg:py-20 w-full space-y-16">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Pre-Publication Brand &amp; Legal Compliance Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-navy leading-[1.15]">
            Accountable Brand Standards for the Enterprise
          </h1>

          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-2xl mx-auto">
            Inkloom AI enables marketing, creative, and legal teams to enforce terminology standards, verify factual claims, and prevent statutory compliance risks before content is published.
          </p>

          {/* Hero CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/demo"
              className="px-6 py-3 bg-teal hover:bg-teal-hover text-white font-bold text-sm rounded-lg shadow-sm transition inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>⚡ Try Demo Personas (Instant Access)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="px-6 py-3 bg-navy hover:bg-navy-dark text-white font-semibold text-sm rounded-lg shadow-sm transition inline-flex items-center gap-2"
            >
              <span>Sign In to Workspace</span>
            </Link>

            <Link
              href="/register"
              className="px-5 py-3 bg-surface hover:bg-workspace text-ink-primary border border-border font-medium text-sm rounded-lg shadow-subtle transition inline-flex items-center gap-2"
            >
              <Building className="w-4 h-4 text-teal" />
              <span>Register New Company</span>
            </Link>

            <Link
              href="/invite"
              className="px-5 py-3 bg-surface hover:bg-workspace text-ink-secondary hover:text-ink-primary border border-border font-medium text-sm rounded-lg shadow-subtle transition inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-ink-muted" />
              <span>Accept Team Invitation</span>
            </Link>
          </div>
        </div>

        {/* 4 Core Pillars of Enterprise Governance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy">Automated Content Audits</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Scan copy and assets across text, PDF, and visual media for unauthorized buzzwords, tone discrepancies, and unverified claims.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy">Statutory Rule Grounding</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Verify legal claims against authoritative statutory frameworks, including FTC Endorsement guidelines, Lanham Act standards, and GDPR disclosures.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy">Human Authority Guarantee</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              AI audits detect potential conflicts, but only designated human compliance officers can authorize release for public campaign distribution.
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
            <span className="hover:text-ink-primary transition cursor-pointer">Security Overview</span>
            <span className="hover:text-ink-primary transition cursor-pointer">Statutory Coverage</span>
            <span className="hover:text-ink-primary transition cursor-pointer">Privacy Notice</span>
            <Link
              href="/demo"
              className="text-teal hover:text-teal-hover font-semibold inline-flex items-center gap-1"
            >
              <span>Evaluation Sandbox</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

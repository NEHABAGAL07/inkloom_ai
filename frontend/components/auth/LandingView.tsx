"use client";

import React, { useState } from "react";
import { useAuth } from "@/services/auth-context";
import { api } from "@/services/api";
import {
  Shield,
  Building,
  Users,
  Scale,
  FileCheck,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";

export function LandingView() {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register" | "invite">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [inviteToken, setInviteToken] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || "Login failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await register({
        email,
        password,
        full_name: fullName,
        organization_name: orgName,
        industry,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await api.acceptInvitation({
        token: inviteToken.trim(),
        full_name: fullName || "New Collaborator",
        password,
      });
      await login(res.user.email, password);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to accept invitation. Verify token validity.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick evaluation role pre-fill
  const selectEvaluationPersona = (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword("password123");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-workspace text-ink-primary flex flex-col justify-between">
      {/* Top Enterprise Brand Bar */}
      <header className="bg-navy border-b border-navy-dark px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center shadow-subtle">
              <span className="text-white font-extrabold text-base tracking-tighter">IK</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">Inkloom AI</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300 px-2 py-0.5 rounded border border-white/15">
                Brand Governance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-status-success"></span>
              <span>Multi-Tenant Platform Active</span>
            </div>
            <a
              href="/login"
              className="text-xs text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition"
            >
              Sign In Portal
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Product Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Enterprise Brand Governance & Compliance Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy tracking-tight leading-[1.15]">
              Authoritative Brand Standards, Verified Before Release.
            </h1>

            <p className="text-ink-secondary text-base sm:text-lg leading-relaxed max-w-2xl">
              Equip marketing, design, and legal compliance officers with automated guideline enforcement. Inspect tone, verify claims, check logo clear-space, and ensure human approval workflows.
            </p>

            {/* Core Enterprise Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 max-w-xl">
              <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle space-y-1">
                <div className="flex items-center gap-2 text-teal font-bold text-sm">
                  <Building className="w-4 h-4" />
                  <span>Tenant Isolation</span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Strict multi-tenant cryptographic boundaries. Content is never shared across organizations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle space-y-1">
                <div className="flex items-center gap-2 text-teal font-bold text-sm">
                  <Users className="w-4 h-4" />
                  <span>Role-Based Access</span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Dedicated workspaces tailored for Brand Managers, Legal Counsel, Designers, and Marketers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle space-y-1">
                <div className="flex items-center gap-2 text-teal font-bold text-sm">
                  <Scale className="w-4 h-4" />
                  <span>Human Authority</span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  AI engines flag violations and cite rules; final authorization remains strictly with human reviewers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle space-y-1">
                <div className="flex items-center gap-2 text-teal font-bold text-sm">
                  <FileCheck className="w-4 h-4" />
                  <span>Statutory Standards</span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Versioned brand guideline profiles with immutable audit trail events for every decision.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-subtle">
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-workspace p-1 rounded-xl mb-6 border border-border">
              <button
                onClick={() => {
                  setActiveTab("login");
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "login"
                    ? "bg-navy text-white shadow-subtle"
                    : "text-ink-secondary hover:text-navy"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab("register");
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "register"
                    ? "bg-navy text-white shadow-subtle"
                    : "text-ink-secondary hover:text-navy"
                }`}
              >
                New Company
              </button>
              <button
                onClick={() => {
                  setActiveTab("invite");
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "invite"
                    ? "bg-navy text-white shadow-subtle"
                    : "text-ink-secondary hover:text-navy"
                }`}
              >
                Have Invite
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {activeTab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Work Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2.5 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2.5 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-teal hover:bg-teal-hover disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-subtle mt-2 flex items-center justify-center gap-2"
                >
                  {isLoading ? "Signing in..." : "Enter Workspace →"}
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Global Corporation"
                    className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Administrator Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Industry</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-workspace border border-border rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:border-teal"
                    >
                      <option value="Technology">Technology & Cloud</option>
                      <option value="Healthcare">Healthcare & Biotech</option>
                      <option value="Financial">Financial Services</option>
                      <option value="Consumer">Consumer Goods</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Create Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-teal hover:bg-teal-hover disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-subtle mt-2"
                >
                  {isLoading ? "Creating Workspace..." : "Create Organization Workspace →"}
                </button>
              </form>
            )}

            {/* TAB 3: INVITATION */}
            {activeTab === "invite" && (
              <form onSubmit={handleAcceptInvite} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Invitation Token</label>
                  <input
                    type="text"
                    required
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="e.g. acme_invite_designer_2026"
                    className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2.5 text-sm font-mono text-teal focus:outline-none focus:border-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Set Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2 text-sm text-navy placeholder:text-ink-muted focus:outline-none focus:border-teal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-status-success hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-subtle mt-2"
                >
                  {isLoading ? "Accepting Invite..." : "Accept Invitation & Join →"}
                </button>
              </form>
            )}

            {/* Evaluation Persona Pre-fills */}
            <div className="mt-8 pt-5 border-t border-border">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Evaluation Accounts
                </span>
                <span className="text-[11px] text-ink-muted">Select to pre-fill</span>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-navy">Acme Cloud Systems</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => selectEvaluationPersona("admin@acmecloud.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs"
                  >
                    <div className="font-bold text-navy truncate">Alex Mercer</div>
                    <div className="text-[10px] text-teal font-semibold">Manager / Admin</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectEvaluationPersona("compliance@acmecloud.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs"
                  >
                    <div className="font-bold text-navy truncate">Elena Rostova</div>
                    <div className="text-[10px] text-teal font-semibold">Legal & Compliance</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectEvaluationPersona("designer@acmecloud.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs"
                  >
                    <div className="font-bold text-navy truncate">Leo Vance</div>
                    <div className="text-[10px] text-teal font-semibold">Senior Designer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectEvaluationPersona("marketing@acmecloud.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs"
                  >
                    <div className="font-bold text-navy truncate">Maya Lin</div>
                    <div className="text-[10px] text-teal font-semibold">Marketing Creator</div>
                  </button>
                </div>

                <div className="text-[11px] font-semibold text-navy pt-2">NovaBio Health Sciences (Isolated Tenant)</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => selectEvaluationPersona("admin@novabio.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs"
                  >
                    <div className="font-bold text-navy truncate">Dr. Rachel Hayes</div>
                    <div className="text-[10px] text-teal font-semibold">Biotech Manager</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectEvaluationPersona("compliance@novabio.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs"
                  >
                    <div className="font-bold text-navy truncate">Marcus Thorne</div>
                    <div className="text-[10px] text-teal font-semibold">FDA Regulatory</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-2">
          <div>Inkloom AI Brand Governance © 2026. Built with Python FastAPI, SQLAlchemy, Next.js & TypeScript.</div>
          <div className="flex items-center gap-3">
            <span>Multi-Tenant Isolation</span>
            <span>•</span>
            <span>Role-Based Access Control</span>
            <span>•</span>
            <span>Human Authority Workflow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

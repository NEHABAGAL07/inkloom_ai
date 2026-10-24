"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/services/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import {
  Shield,
  Building,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  UserCheck,
} from "lucide-react";

function LoginContent() {
  const { login, register, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect") || "/";

  // Tab state
  const [activeTab, setActiveTab] = useState<"signin" | "register" | "invite">("signin");

  // Form input states
  const [email, setEmail] = useState("admin@acmecloud.com");
  const [password, setPassword] = useState("password123");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [inviteToken, setInviteToken] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      setSuccessMessage("Authenticated successfully! Loading workspace...");
      setTimeout(() => {
        router.push(redirectUrl);
      }, 300);
    } catch (err: any) {
      setErrorMessage(err?.message || "Login failed. Please verify credentials.");
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
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        organization_name: orgName.trim(),
        industry,
      });
      setSuccessMessage("Workspace created successfully! Redirecting...");
      setTimeout(() => {
        router.push(redirectUrl);
      }, 300);
    } catch (err: any) {
      setErrorMessage(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) {
      setErrorMessage("Please provide a valid invitation token.");
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await api.acceptInvitation({
        token: inviteToken.trim(),
        full_name: fullName.trim() || "New Collaborator",
        password,
      });
      const orgName = (res as any).organization?.name || res.memberships?.[0]?.organization_name || "the workspace";
      setSuccessMessage(`Invitation accepted! Welcome to ${orgName}.`);
      await login(res.user.email, password);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 300);
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid or expired invitation token.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword("password123");
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await login(targetEmail, "password123");
      setSuccessMessage("Loading workspace...");
      setTimeout(() => {
        router.push(redirectUrl);
      }, 300);
    } catch (err: any) {
      setErrorMessage(err?.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-workspace text-ink-primary flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-navy border-b border-navy-dark px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center shadow-subtle">
              <span className="text-white font-extrabold text-base tracking-tighter">IK</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">Inkloom AI</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300 px-2 py-0.5 rounded border border-white/15">
                Brand Governance
              </span>
            </div>
          </a>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full bg-teal/20 text-slate-200 border border-teal/40 font-semibold items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse"></span>
              Multi-Tenant Secure
            </span>
            <a
              href="/"
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/20 hover:border-white/40 transition"
            >
              ← Platform Home
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-6 py-10 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Quick Personas & Role Overview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Verified Access Station</span>
              </div>
              <h1 className="text-3xl font-extrabold text-navy tracking-tight">
                Access Workspace
              </h1>
              <p className="text-ink-secondary text-xs sm:text-sm leading-relaxed">
                Log in to your tenant-isolated brand governance dashboard with verified credentials, or select an evaluation account below.
              </p>
            </div>

            {/* Quick Demo Personas Box */}
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-teal" />
                  <span>Evaluation Accounts</span>
                </span>
                <span className="text-[11px] text-ink-muted">One-click evaluation</span>
              </div>

              {/* Company 1: Acme Cloud */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-navy flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal"></span>
                  <span>Acme Cloud Systems (Technology)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("admin@acmecloud.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs group"
                  >
                    <div className="font-bold text-navy group-hover:text-teal truncate">Alex Mercer</div>
                    <div className="text-[10px] text-teal font-semibold truncate">Manager / Admin</div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("compliance@acmecloud.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs group"
                  >
                    <div className="font-bold text-navy group-hover:text-teal truncate">Elena Rostova</div>
                    <div className="text-[10px] text-teal font-semibold truncate">Legal & Compliance</div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("designer@acmecloud.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs group"
                  >
                    <div className="font-bold text-navy group-hover:text-teal truncate">Leo Vance</div>
                    <div className="text-[10px] text-teal font-semibold truncate">Senior Designer</div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("marketing@acmecloud.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs group"
                  >
                    <div className="font-bold text-navy group-hover:text-teal truncate">Maya Lin</div>
                    <div className="text-[10px] text-teal font-semibold truncate">Marketing Creator</div>
                  </button>
                </div>
              </div>

              {/* Company 2: NovaBio */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="text-[11px] font-semibold text-navy flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal"></span>
                  <span>NovaBio Health Sciences (Biotech)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("admin@novabio.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs group"
                  >
                    <div className="font-bold text-navy group-hover:text-teal truncate">Dr. Rachel Hayes</div>
                    <div className="text-[10px] text-teal font-semibold truncate">Biotech Manager</div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("compliance@novabio.com")}
                    className="text-left p-2.5 rounded-xl bg-workspace border border-border hover:border-teal transition text-xs group"
                  >
                    <div className="font-bold text-navy group-hover:text-teal truncate">Marcus Thorne</div>
                    <div className="text-[10px] text-teal font-semibold truncate">FDA Regulatory</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-7 bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-subtle">
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-workspace p-1 rounded-xl mb-6 border border-border">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signin");
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "signin"
                    ? "bg-navy text-white shadow-subtle"
                    : "text-ink-secondary hover:text-navy"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
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
                type="button"
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
                Accept Invite
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-status-error text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {activeTab === "signin" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1.5">Work Email Address *</label>
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
                  <label className="block text-xs font-semibold text-navy mb-1.5">Password *</label>
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
                  className="w-full py-3 px-4 bg-teal hover:bg-teal-hover disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-subtle flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? "Signing in..." : "Enter Workspace →"}
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Company / Organization Name *</label>
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
                    <label className="block text-xs font-semibold text-navy mb-1">Administrator Name *</label>
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
                  <label className="block text-xs font-semibold text-navy mb-1">Work Email Address *</label>
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
                  <label className="block text-xs font-semibold text-navy mb-1">Password *</label>
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
                  <label className="block text-xs font-semibold text-navy mb-1">Invitation Token *</label>
                  <input
                    type="text"
                    required
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="e.g. acme_invite_token_2026"
                    className="w-full bg-workspace border border-border rounded-xl px-3.5 py-2.5 text-sm font-mono text-teal focus:outline-none focus:border-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Your Full Name *</label>
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
                  <label className="block text-xs font-semibold text-navy mb-1">Set Password *</label>
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
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-2">
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-ink-muted">Loading authentication portal...</div>}>
      <LoginContent />
    </Suspense>
  );
}

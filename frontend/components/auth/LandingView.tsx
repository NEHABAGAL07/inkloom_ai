"use client";

import React, { useState } from "react";
import { useAuth } from "@/services/auth-context";
import { api } from "@/services/api";

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

  // Quick Persona Test Login
  const quickPersonaLogin = async (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword("password123");
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(personaEmail, "password123");
    } catch (err: any) {
      setErrorMessage(err.message || "Demo login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between pb-8 border-b border-slate-800/60 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-xl font-black text-white">I</span>
          </div>
          <span className="font-bold text-xl text-white tracking-tight">
            Inkloom <span className="text-indigo-400 font-extrabold text-sm px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Enterprise Brand Governance</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Multi-Tenant Active
          </span>
        </div>
      </header>

      {/* Main Grid: Hero + Authentication Card */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 py-10 items-center z-10">
        {/* Left: Product Value Proposition */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
            <span>🛡️ Enterprise Multi-Tenant Workspaces</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Intelligent Brand Integrity at Enterprise Scale
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
            Independent workspaces for enterprise organizations. Automated pre-publication audits across tone, verified facts, and brand terminology—keeping human compliance officers firmly in control.
          </p>

          {/* Key Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-xl">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-indigo-400 text-lg mb-1">🏢</div>
              <div className="text-sm font-bold text-white">Tenant Isolation</div>
              <div className="text-xs text-slate-400 mt-0.5">Strict data boundary. Companies never see another organization&apos;s submissions.</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-fuchsia-400 text-lg mb-1">👥</div>
              <div className="text-sm font-bold text-white">4 Distinct Roles</div>
              <div className="text-xs text-slate-400 mt-0.5">Dedicated workspaces for Managers, Designers, Legal Officers, and Marketers.</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-emerald-400 text-lg mb-1">⚖️</div>
              <div className="text-sm font-bold text-white">Human Authority</div>
              <div className="text-xs text-slate-400 mt-0.5">AI engine flags compliance flaws; only designated reviewers make final approvals.</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-sky-400 text-lg mb-1">🔍</div>
              <div className="text-sm font-bold text-white">Truth Invariance</div>
              <div className="text-xs text-slate-400 mt-0.5">Certified benchmark verification prevents hallucinated factual citations.</div>
            </div>
          </div>
        </div>

        {/* Right: Authentication Box */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              onClick={() => { setActiveTab("login"); setErrorMessage(null); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "login"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab("register"); setErrorMessage(null); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "register"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              New Company
            </button>
            <button
              onClick={() => { setActiveTab("invite"); setErrorMessage(null); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === "invite"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Have Invite?
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? "Signing in..." : "Enter Workspace →"}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER ORGANIZATION */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Global Corporation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Administrator Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Technology">Technology & Cloud</option>
                    <option value="Healthcare">Healthcare & Biotech</option>
                    <option value="Financial">Financial Services</option>
                    <option value="Consumer">Consumer Goods</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Create Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 mt-2"
              >
                {isLoading ? "Creating Workspace..." : "Create Organization Workspace →"}
              </button>
            </form>
          )}

          {/* TAB 3: JOIN VIA INVITATION */}
          {activeTab === "invite" && (
            <form onSubmit={handleAcceptInvite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Invitation Token</label>
                <input
                  type="text"
                  required
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  placeholder="e.g. acme_invite_designer_2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-indigo-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Set Your Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/25 mt-2"
              >
                {isLoading ? "Accepting Invite..." : "Accept Invitation & Join →"}
              </button>
            </form>
          )}

          {/* HACKATHON DEMO PERSONAS QUICK SWITCH */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <span>⚡</span> Hackathon One-Click Demo Personas
              </span>
              <span className="text-[10px] text-slate-400">Password: password123</span>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400">Company 1: Acme Cloud Systems</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickPersonaLogin("admin@acmecloud.com")}
                  className="text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-900 transition-all text-xs"
                >
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>👔</span> Alex Mercer
                  </div>
                  <div className="text-[10px] text-indigo-400 font-semibold">Manager / Admin</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickPersonaLogin("compliance@acmecloud.com")}
                  className="text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900 transition-all text-xs"
                >
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>⚖️</span> Elena Rostova
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold">Legal & Compliance</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickPersonaLogin("designer@acmecloud.com")}
                  className="text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-fuchsia-500/60 hover:bg-slate-900 transition-all text-xs"
                >
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>🎨</span> Leo Vance
                  </div>
                  <div className="text-[10px] text-fuchsia-400 font-semibold">Designer</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickPersonaLogin("marketing@acmecloud.com")}
                  className="text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900 transition-all text-xs"
                >
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>📢</span> Maya Lin
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold">Marketing Creator</div>
                </button>
              </div>

              <div className="text-[11px] font-semibold text-slate-400 pt-2">Company 2: NovaBio Health Sciences (Isolated Tenant)</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickPersonaLogin("admin@novabio.com")}
                  className="text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-teal-500/60 hover:bg-slate-900 transition-all text-xs"
                >
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>🧬</span> Dr. Rachel Hayes
                  </div>
                  <div className="text-[10px] text-teal-400 font-semibold">Biotech Manager</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickPersonaLogin("compliance@novabio.com")}
                  className="text-left p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-teal-500/60 hover:bg-slate-900 transition-all text-xs"
                >
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>🔬</span> Marcus Thorne
                  </div>
                  <div className="text-[10px] text-teal-400 font-semibold">FDA Regulatory</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 z-10">
        <div>Inkloom AI Brand Governance © 2026. Built with Python FastAPI, SQLAlchemy, Next.js & TypeScript.</div>
        <div className="flex gap-4">
          <span>Enterprise Multi-Tenancy</span>
          <span>•</span>
          <span>Role-Based Access Control</span>
          <span>•</span>
          <span>Human-in-the-Loop Safeguards</span>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/services/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";

function LoginContent() {
  const { login, register, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect") || "/";

  // Tab state: employee, admin, register, invite
  const [activeTab, setActiveTab] = useState<"employee" | "admin" | "register" | "invite">("employee");

  // Form input states
  const [email, setEmail] = useState("marketing@acmecloud.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
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

  // Adjust defaults when switching tabs
  const handleTabChange = (tab: "employee" | "admin" | "register" | "invite") => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (tab === "employee") {
      setEmail("marketing@acmecloud.com");
      setPassword("password123");
    } else if (tab === "admin") {
      setEmail("admin@acmecloud.com");
      setPassword("password123");
    } else {
      setEmail("");
      setPassword("");
    }
  };

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
        full_name: fullName.trim() || "Collaborator",
        password,
      });
      await login(res.user.email, password);
      setSuccessMessage("Invitation accepted! Welcome to the workspace.");
      setTimeout(() => {
        router.push(redirectUrl);
      }, 300);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to accept invitation. Please check the token.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (personaEmail: string, roleName: string) => {
    setEmail(personaEmail);
    setPassword("password123");
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(personaEmail, "password123");
      setSuccessMessage(`Welcome back! Logged in as ${roleName}.`);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 300);
    } catch (err: any) {
      setErrorMessage(err?.message || "Quick demo login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-hidden text-slate-100">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800/80 z-10">
        <a href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <span className="text-xl font-black text-white">I</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-white tracking-tight flex items-center gap-1.5">
              Inkloom <span className="text-indigo-400 font-extrabold text-xs px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Enterprise Brand Governance</span>
          </div>
        </a>

        <div className="flex items-center gap-4">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Multi-Tenant Secure
          </span>
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition"
          >
            ← Platform Home
          </a>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full py-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Quick Personas & Role Overview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
                <span>⚡ Instant One-Click Login</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Access Workspace
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Log in to your tenant-isolated brand governance dashboard, or test out any role instantly below.
              </p>
            </div>

            {/* Quick Demo Personas Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <span>🚀</span> Quick Test Personas
                </span>
                <span className="text-[11px] text-slate-400 font-mono">pwd: password123</span>
              </div>

              {/* Company 1: Acme Cloud */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span>Acme Cloud Systems (Enterprise Tech)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("admin@acmecloud.com", "Alex Mercer (Manager)")}
                    className="text-left p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/70 hover:bg-indigo-950/20 transition-all text-xs group"
                  >
                    <div className="font-bold text-white group-hover:text-indigo-300 flex items-center gap-1 truncate">
                      <span>👔</span> Alex Mercer
                    </div>
                    <div className="text-[10px] text-indigo-400 font-semibold truncate">Manager / Admin</div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("compliance@acmecloud.com", "Elena Rostova (Legal)")}
                    className="text-left p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/70 hover:bg-emerald-950/20 transition-all text-xs group"
                  >
                    <div className="font-bold text-white group-hover:text-emerald-300 flex items-center gap-1 truncate">
                      <span>⚖️</span> Elena Rostova
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold truncate">Legal & Compliance</div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("designer@acmecloud.com", "Leo Vance (Designer)")}
                    className="text-left p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-fuchsia-500/70 hover:bg-fuchsia-950/20 transition-all text-xs group"
                  >
                    <div className="font-bold text-white group-hover:text-fuchsia-300 flex items-center gap-1 truncate">
                      <span>🎨</span> Leo Vance
                    </div>
                    <div className="text-[10px] text-fuchsia-400 font-semibold truncate">Senior Designer</div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("marketing@acmecloud.com", "Maya Lin (Marketing)")}
                    className="text-left p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/70 hover:bg-amber-950/20 transition-all text-xs group"
                  >
                    <div className="font-bold text-white group-hover:text-amber-300 flex items-center gap-1 truncate">
                      <span>📢</span> Maya Lin
                    </div>
                    <div className="text-[10px] text-amber-400 font-semibold truncate">Marketing Creator</div>
                  </button>
                </div>
              </div>

              {/* Company 2: NovaBio */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span>NovaBio Health (Isolated Tenant)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("admin@novabio.com", "Dr. Rachel Hayes (Biotech)")}
                    className="text-left p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/70 hover:bg-teal-950/20 transition-all text-xs group"
                  >
                    <div className="font-bold text-white group-hover:text-teal-300 flex items-center gap-1 truncate">
                      <span>🧬</span> Dr. Rachel Hayes
                    </div>
                    <div className="text-[10px] text-teal-400 font-semibold truncate">Biotech Admin</div>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickLogin("compliance@novabio.com", "Marcus Thorne (Regulatory)")}
                    className="text-left p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/70 hover:bg-teal-950/20 transition-all text-xs group"
                  >
                    <div className="font-bold text-white group-hover:text-teal-300 flex items-center gap-1 truncate">
                      <span>🔬</span> Marcus Thorne
                    </div>
                    <div className="text-[10px] text-teal-400 font-semibold truncate">FDA Regulatory</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Credentials Form */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Tab Selector */}
            <div className="grid grid-cols-4 gap-1 bg-slate-950/80 p-1.5 rounded-2xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => handleTabChange("employee")}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "employee"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                👤 Employee
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("admin")}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "admin"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                👔 Admin
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("register")}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "register"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🏢 New Org
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("invite")}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
                  activeTab === "invite"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ✉️ Invite
              </button>
            </div>

            {/* Notifications */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <span>✅</span>
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: EMPLOYEE LOGIN */}
            {activeTab === "employee" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 mb-2">
                  <div className="text-[11px] text-slate-400 font-semibold mb-2">Quick Employee Pre-Fill:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { setEmail("marketing@acmecloud.com"); setPassword("password123"); }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-800/50 text-amber-300 font-medium transition"
                    >
                      📢 Marketing Creator
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEmail("designer@acmecloud.com"); setPassword("password123"); }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-fuchsia-800/50 text-fuchsia-300 font-medium transition"
                    >
                      🎨 Senior Designer
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEmail("compliance@acmecloud.com"); setPassword("password123"); }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-800/50 text-emerald-300 font-medium transition"
                    >
                      ⚖️ Legal & Compliance
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Employee Work Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="marketing@acmecloud.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In to Employee Workspace →</span>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: ADMIN LOGIN */}
            {activeTab === "admin" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 mb-2">
                  <div className="text-[11px] text-slate-400 font-semibold mb-2">Quick Admin Pre-Fill:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { setEmail("admin@acmecloud.com"); setPassword("password123"); }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-indigo-800/50 text-indigo-300 font-medium transition"
                    >
                      👔 Acme Cloud Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEmail("admin@novabio.com"); setPassword("password123"); }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-teal-800/50 text-teal-300 font-medium transition"
                    >
                      🧬 NovaBio Health Admin
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Administrator Work Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@acmecloud.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Admin Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In to Executive Console →</span>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: REGISTER NEW ORGANIZATION */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Apex Global Technologies"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Full Name</label>
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
                    placeholder="admin@apextech.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Set Password</label>
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

            {/* TAB 4: ACCEPT INVITATION */}
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
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 z-10">
        <div>Inkloom AI Brand Governance © 2026. Enterprise Tenant Isolation & Governance.</div>
        <div className="flex gap-4">
          <a href="/" className="hover:text-slate-300 transition">Home</a>
          <span>•</span>
          <a href="/login" className="hover:text-slate-300 transition">Login</a>
          <span>•</span>
          <a href="/invite" className="hover:text-slate-300 transition">Invites</a>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading login portal...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

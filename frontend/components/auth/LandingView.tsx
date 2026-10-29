"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/auth-context";
import { InkloomLogo } from "@/components/layout/InkloomLogo";
import { ThemeToggle } from "@/services/theme-context";
import {
  Shield,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Palette,
  FileText,
  Scale,
  Loader2,
  BookOpen,
  UserCheck,
  ShieldCheck,
  Check,
  Edit2,
} from "lucide-react";

interface QuickDept {
  id: string;
  name: string;
  role: string;
  email: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUICK_DEPARTMENTS: QuickDept[] = [
  {
    id: "admin",
    name: "Alex Mercer",
    role: "Brand Admin",
    email: "admin@acmecloud.com",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-[#272727] dark:text-[#FFAA35] dark:border-[#383838]",
    icon: Shield,
  },
  {
    id: "designer",
    name: "Leo Vance",
    role: "Brand Designer",
    email: "designer@acmecloud.com",
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-[#272727] dark:text-[#C084FC] dark:border-[#383838]",
    icon: Palette,
  },
  {
    id: "marketing",
    name: "Maya Lin",
    role: "Marketing Lead",
    email: "marketing@acmecloud.com",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#272727] dark:text-[#FFD84D] dark:border-[#383838]",
    icon: FileText,
  },
  {
    id: "compliance",
    name: "Elena Rostova",
    role: "Legal & Regulatory",
    email: "compliance@acmecloud.com",
    badge: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-[#272727] dark:text-[#72D6A1] dark:border-[#383838]",
    icon: Scale,
  },
];

export function LandingView() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [signingInDept, setSigningInDept] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDemoPersonas, setShowDemoPersonas] = useState(false);

  const handleQuickDeptLogin = async (deptEmail: string, deptId: string) => {
    setSigningInDept(deptId);
    setErrorMessage(null);
    try {
      await login(deptEmail, "demo123456", true);
      router.push("/");
    } catch (err: any) {
      console.error("Department login failure:", err);
      setErrorMessage(err.message || "Failed to sign into workspace.");
    } finally {
      setSigningInDept(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email.trim(), password, rememberMe);
      router.push("/");
    } catch (err: any) {
      console.error("Sign-in failure:", err);
      setErrorMessage(err.message || "Invalid credentials. Try instant department access.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#111111] text-slate-800 dark:text-ink-primary flex flex-col justify-between selection:bg-[#10B981]/30 selection:text-white transition-colors duration-150">
      {/* Top Navbar (Image 2 reference) */}
      <header className="px-6 lg:px-12 py-4 flex items-center justify-between border-b border-slate-200 dark:border-[#292929] bg-white dark:bg-[#111111] sticky top-0 z-40 transition-colors duration-150">
        <div className="flex items-center gap-2">
          <InkloomLogo size="md" showSubtitle={false} />
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider dark:bg-[#202020] dark:text-[#FFAA35] dark:border-[#383838]">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline italic font-serif text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            A little more clarity in every message.
          </span>
          <ThemeToggle className="!w-8 !h-8 !rounded-full bg-white dark:bg-[#1C1C1C] border-slate-300 dark:border-[#383838] shadow-xs" />
        </div>
      </header>

      {/* Split-Screen Main Hero (Image 2 reference) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* ========================================================
              LEFT COLUMN: Gradient Editorial Hero & Floating Review Card (Image 2)
              ======================================================== */}
          <div className="lg:col-span-7 rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-[#10B981] via-[#0D9488] to-[#0284C7] dark:from-[#1A1A1A] dark:to-[#141414] text-white flex flex-col justify-between space-y-7 shadow-xl relative overflow-hidden">
            {/* Background ambient accents */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/10 filter blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#0284C7]/20 filter blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Top Tag Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#064E3B]/35 border border-white/20 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-2xs">
                <span>CONTENT GOVERNANCE FOR TEAMS</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl font-heading font-extrabold tracking-tight text-white leading-tight">
                Good content. <br />
                <span className="text-[#A7F3D0] dark:text-[#FFAA35]">On brand.</span> By design.
              </h1>

              {/* Subtitle */}
              <p className="text-sm text-white/90 leading-relaxed max-w-lg">
                Bring brand standards, clear feedback, and thoughtful human approval into one calm workspace.
              </p>

              {/* 3 Translucent Feature Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-start gap-2.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Clear guidance</h3>
                    <p className="text-[10.5px] text-white/80 mt-0.5 leading-snug">
                      Explainable content checks
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-start gap-2.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Human approval</h3>
                    <p className="text-[10.5px] text-white/80 mt-0.5 leading-snug">
                      People make the final call
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-start gap-2.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Brand standards</h3>
                    <p className="text-[10.5px] text-white/80 mt-0.5 leading-snug">
                      Approved rules, all together
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Content Review Card (Image 2 reference) */}
              <div className="rounded-2xl bg-white dark:bg-[#1C1C1C] p-5 shadow-2xl border border-white/40 dark:border-[#383838] text-slate-900 dark:text-[#F7F3ED] space-y-3 relative z-20">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-[#272727]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-[#85817D] tracking-wider uppercase ml-1">
                      CONTENT REVIEW
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#10B981] dark:text-[#72D6A1]">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span>Ready to review</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 items-center">
                  <div className="sm:col-span-7 space-y-1.5">
                    <div className="text-[9px] font-bold text-slate-400 dark:text-[#85817D] uppercase tracking-wider">
                      CAMPAIGN DRAFT • WEB PAGE
                    </div>
                    <div className="text-sm font-serif font-bold text-slate-900 dark:text-white">
                      Make room for better work.
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 bg-slate-100 dark:bg-[#272727] rounded-full w-full" />
                      <div className="h-1.5 bg-slate-100 dark:bg-[#272727] rounded-full w-3/4" />
                    </div>
                  </div>

                  <div className="sm:col-span-5">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Voice looks good</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Brand tone aligned</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-[#272727] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#FB923C] text-white flex items-center justify-center font-bold text-[9px]">
                      JD
                    </div>
                    <span>Human review stays in control</span>
                  </div>
                  <Edit2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#FFAA35]" />
                </div>
              </div>
            </div>

            {/* Bottom Tagline */}
            <div className="text-xs text-white/90 font-medium tracking-wide pt-2">
              Clear feedback. Confident teams. Better drafts.
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: Clean Sign-In Form (Image 2)
              ======================================================== */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="bg-white dark:bg-[#1C1C1C] rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200 dark:border-[#383838] w-full max-w-md space-y-5 relative">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#85817D]">
                  YOUR WORKSPACE AWAITS
                </span>
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="w-7 h-7 shrink-0">
                    <img src="/inkloom-feather-cute@2x.png" alt="Inkloom" className="w-full h-full object-contain" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F172A] dark:text-[#F7F3ED] tracking-tight">
                    Welcome back<span className="text-[#2563EB] dark:text-[#FFAA35]">.</span>
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#85817D] pt-0.5">
                  Sign in to pick up where you left off.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#272727] border border-rose-200 dark:border-[#FF6B78]/40 text-rose-700 dark:text-[#FF6B78] text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-[#FF6B78] shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Credentials Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F7F3ED] mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-[#85817D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#383838] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#0F172A] dark:text-[#F7F3ED] placeholder:text-slate-400 dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10B981] dark:focus:border-[#FFAA35] transition shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F7F3ED] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-[#85817D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#383838] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#0F172A] dark:text-[#F7F3ED] placeholder:text-slate-400 dark:placeholder:text-[#85817D] focus:outline-none focus:border-[#10B981] dark:focus:border-[#FFAA35] transition shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-[#85817D] dark:hover:text-[#F7F3ED] transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-[#B8B2AC]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 dark:border-[#383838] bg-white dark:bg-[#141414] text-[#2563EB] focus:ring-[#2563EB] w-3.5 h-3.5"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowDemoPersonas(true);
                    }}
                    className="text-xs text-[#2563EB] dark:text-[#FFAA35] font-semibold hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Primary Turquoise-to-Royal-Blue Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !!signingInDept}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#10B981] via-[#0284C7] to-[#2563EB] text-white dark:btn-gradient-warm rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-slate-200 dark:border-[#383838] w-full" />
                <span className="bg-white dark:bg-[#1C1C1C] px-3 text-[10px] text-slate-400 dark:text-[#85817D] tracking-wide uppercase font-semibold absolute">
                  or continue with
                </span>
              </div>

              {/* Google & GitHub Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickDeptLogin("admin@acmecloud.com", "admin")}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-[#383838] bg-white hover:bg-slate-50 dark:bg-[#202020] dark:hover:bg-[#272727] flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 dark:text-[#F7F3ED] transition shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDeptLogin("marketing@acmecloud.com", "marketing")}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-[#383838] bg-white hover:bg-slate-50 dark:bg-[#202020] dark:hover:bg-[#272727] flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 dark:text-[#F7F3ED] transition shadow-2xs"
                >
                  <svg className="w-4 h-4 fill-slate-800 dark:fill-white" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              {/* 1-Click Instant Department Persona Switcher */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowDemoPersonas(!showDemoPersonas)}
                  className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
                >
                  {showDemoPersonas ? "Hide 1-Click Demo Personas ▲" : "Show 1-Click Demo Personas ▼"}
                </button>

                {showDemoPersonas && (
                  <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in duration-150">
                    {QUICK_DEPARTMENTS.map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        disabled={!!signingInDept || isLoading}
                        onClick={() => handleQuickDeptLogin(dept.email, dept.id)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-[#383838] bg-slate-50 hover:bg-slate-100 dark:bg-[#202020] text-left transition disabled:opacity-50"
                      >
                        <div className="text-[10px] font-bold text-[#10B981] dark:text-[#FFAA35]">{dept.role}</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{dept.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer text */}
              <div className="pt-2 text-center text-xs space-y-1">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">New to Inkloom? </span>
                  <Link
                    href="/register"
                    className="font-bold text-[#2563EB] dark:text-[#FFAA35] hover:underline"
                  >
                    Create an account →
                  </Link>
                </div>
                <div className="text-[10.5px] text-slate-400 dark:text-slate-500">
                  Thoughtful content review, with people in control.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-3.5 border-t border-slate-200 dark:border-[#292929] bg-white dark:bg-[#111111] text-[11px] text-slate-500 dark:text-[#85817D] flex flex-col sm:flex-row items-center justify-between gap-2 transition-colors duration-150">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>Tenant Zero-Trust Isolation Active</span>
        </div>
        <div>Inkloom AI Brand Governance © 2026. All rights reserved.</div>
      </footer>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  Search,
  X,
  FileText,
  ShieldCheck,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  Command,
  CheckCircle,
  AlertCircle,
  Scale,
} from "lucide-react";

interface SearchResultItem {
  id: string;
  category: "guidelines" | "submissions" | "team" | "navigation";
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  url: string;
}

const STATIC_NAVIGATION_ITEMS: SearchResultItem[] = [
  {
    id: "nav-dashboard",
    category: "navigation",
    title: "Governance Dashboard",
    subtitle: "High-level overview of submissions, compliance scores, and approval rates",
    badge: "Dashboard",
    url: "/",
  },
  {
    id: "nav-guidelines",
    category: "navigation",
    title: "Brand Guidelines & Rules",
    subtitle: "Explore active brand standards, statutory guardrails, and version history",
    badge: "Guidelines",
    url: "/guidelines",
  },
  {
    id: "nav-submit",
    category: "navigation",
    title: "Submit Content for Audit",
    subtitle: "Upload marketing copy or media assets for pre-publication AI compliance check",
    badge: "Create",
    url: "/content",
  },
  {
    id: "nav-reviews",
    category: "navigation",
    title: "Pre-Publication Review Queue",
    subtitle: "Authorized compliance review queue for pending content release authorizations",
    badge: "Reviews",
    url: "/reviews",
  },
  {
    id: "nav-audits",
    category: "navigation",
    title: "Audit Findings & History",
    subtitle: "View comprehensive AI audit reports, violation severities, and suggested fixes",
    badge: "Audits",
    url: "/audits",
  },
  {
    id: "nav-analytics",
    category: "navigation",
    title: "Governance Analytics",
    subtitle: "Inspect compliance metrics, failure frequency by category, and turnaround times",
    badge: "Analytics",
    url: "/analytics",
  },
  {
    id: "nav-team",
    category: "navigation",
    title: "Team & Role Permissions",
    subtitle: "Manage organization members, assign roles, and issue workspace invitations",
    badge: "Team",
    url: "/team",
  },
];

export function GlobalSearchBar() {
  const router = useRouter();
  const { activeOrgId, activeOrgName } = useAuth();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Cached searchable data from existing APIs
  const [cachedRules, setCachedRules] = useState<any[]>([]);
  const [cachedSubmissions, setCachedSubmissions] = useState<any[]>([]);
  const [cachedMembers, setCachedMembers] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load searchable data on mount or organization change
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [profileRes, subsRes, membersRes] = await Promise.allSettled([
          api.getGuidelineProfile(),
          api.getSubmissions(),
          activeOrgId ? api.getMembers(activeOrgId) : Promise.resolve([]),
        ]);

        if (!isMounted) return;

        if (profileRes.status === "fulfilled" && profileRes.value) {
          const profile = profileRes.value;
          const gData = profile.published_data || profile.draft_data;
          const rules: any[] = [];

          if (gData?.compliance && Array.isArray(gData.compliance)) {
            rules.push(
              ...gData.compliance.map((c: any) => ({
                id: c.id || c.title || Math.random().toString(),
                title: c.title,
                description: c.rule_text,
                rule_reference: c.category?.toUpperCase() || "COMPLIANCE",
                category: c.category || "compliance",
              }))
            );
          }

          if (gData?.voice?.words_to_avoid && Array.isArray(gData.voice.words_to_avoid)) {
            rules.push(
              ...gData.voice.words_to_avoid.map((w: string) => ({
                id: `prohibited-${w}`,
                title: `Restricted Word: "${w}"`,
                description: "Prohibited by brand voice and statutory standards",
                rule_reference: "RESTRICTED-TERM",
                category: "terminology",
              }))
            );
          }

          if (gData?.dos_and_donts && Array.isArray(gData.dos_and_donts)) {
            rules.push(
              ...gData.dos_and_donts.map((d: any) => ({
                id: `dodont-${d.topic || Math.random()}`,
                title: `Guideline: ${d.topic}`,
                description: `DO: ${d.do_text} • DON'T: ${d.dont_text}`,
                rule_reference: "DO-DONT",
                category: "guidelines",
              }))
            );
          }

          setCachedRules(rules);
        }

        if (subsRes.status === "fulfilled" && Array.isArray(subsRes.value)) {
          setCachedSubmissions(subsRes.value);
        }

        if (membersRes.status === "fulfilled" && Array.isArray(membersRes.value)) {
          setCachedMembers(membersRes.value);
        }
      } catch (err) {
        console.warn("Search cache initialization:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeOrgId]);

  // Global keyboard shortcut ('/' or 'Cmd+K' / 'Ctrl+K')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "/" && (e.target as HTMLElement).tagName !== "INPUT" && (e.target as HTMLElement).tagName !== "TEXTAREA") ||
          ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter results across categories
  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // If empty query, show common quick navigation items
      return STATIC_NAVIGATION_ITEMS.slice(0, 5);
    }

    const results: SearchResultItem[] = [];

    // 1. Search Brand Rules & Claims
    for (const rule of cachedRules) {
      const matchTitle = (rule.title || "").toLowerCase().includes(trimmed);
      const matchDesc = (rule.description || "").toLowerCase().includes(trimmed);
      const matchRef = (rule.rule_reference || "").toLowerCase().includes(trimmed);
      const matchCat = (rule.category || "").toLowerCase().includes(trimmed);

      if (matchTitle || matchDesc || matchRef || matchCat) {
        results.push({
          id: `rule-${rule.id || rule.rule_reference || Math.random()}`,
          category: "guidelines",
          title: rule.title || rule.rule_reference || "Brand Guideline Rule",
          subtitle: rule.description || rule.category || "Statutory & Brand Guardrail",
          badge: rule.rule_reference || rule.category?.toUpperCase() || "RULE",
          badgeColor: "bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-700/50",
          url: "/guidelines",
        });
      }
      if (results.length >= 4) break;
    }

    // 2. Search Submissions & Content
    for (const sub of cachedSubmissions) {
      const matchTitle = (sub.title || "").toLowerCase().includes(trimmed);
      const matchText = (sub.content_text || "").toLowerCase().includes(trimmed);
      const matchCampaign = (sub.campaign || "").toLowerCase().includes(trimmed);
      const matchAuthor = (sub.author || "").toLowerCase().includes(trimmed);

      if (matchTitle || matchText || matchCampaign || matchAuthor) {
        results.push({
          id: `sub-${sub.id}`,
          category: "submissions",
          title: sub.title || "Content Submission",
          subtitle: `${sub.campaign ? `Campaign: ${sub.campaign} • ` : ""}${sub.status || "Pending"}`,
          badge: sub.status?.replace("_", " ").toUpperCase() || "SUBMISSION",
          badgeColor: "bg-navy/10 dark:bg-navy-light/40 text-navy dark:text-slate-200 border-navy/20 dark:border-slate-700",
          url: `/audits?id=${sub.id}`,
        });
      }
      if (results.length >= 7) break;
    }

    // 3. Search Team Members
    for (const mem of cachedMembers) {
      const matchName = (mem.full_name || "").toLowerCase().includes(trimmed);
      const matchEmail = (mem.email || "").toLowerCase().includes(trimmed);
      const matchRole = (mem.role || "").toLowerCase().includes(trimmed);

      if (matchName || matchEmail || matchRole) {
        results.push({
          id: `mem-${mem.user_id || mem.email}`,
          category: "team",
          title: mem.full_name || mem.email,
          subtitle: `${mem.email} • Assigned Role: ${mem.role}`,
          badge: mem.role?.toUpperCase() || "MEMBER",
          badgeColor: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
          url: "/team",
        });
      }
      if (results.length >= 9) break;
    }

    // 4. Search Static Navigation
    for (const nav of STATIC_NAVIGATION_ITEMS) {
      if (nav.title.toLowerCase().includes(trimmed) || nav.subtitle.toLowerCase().includes(trimmed)) {
        results.push(nav);
      }
      if (results.length >= 10) break;
    }

    return results;
  }, [query, cachedRules, cachedSubmissions, cachedMembers]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = useCallback(
    (item: SearchResultItem) => {
      setIsOpen(false);
      setIsMobileSearchOpen(false);
      setQuery("");
      router.push(item.url);
    },
    [router]
  );

  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setIsMobileSearchOpen(false);
      inputRef.current?.blur();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "guidelines":
        return <Scale className="w-4 h-4 text-teal" />;
      case "submissions":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "team":
        return <Users className="w-4 h-4 text-amber-500" />;
      default:
        return <Compass className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <>
      {/* ----------------------------------------------------
          Desktop Centered Global Search Input
          ---------------------------------------------------- */}
      <div className="hidden md:flex flex-1 justify-center items-center w-full max-w-[520px] mx-auto px-2 relative">
        <div className="relative w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 pointer-events-none transition-colors group-focus-within:text-teal" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setSelectedIndex(0);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search guidelines, rules, claims, or audits... (Press / to focus)"
              aria-label="Global search across guidelines, rules, claims, and submissions"
              className="w-full bg-workspace dark:bg-[#111C2E] border border-border rounded-xl pl-10 pr-16 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all duration-150 shadow-sm"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 p-0.5 text-ink-muted hover:text-ink-primary transition-colors rounded"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="absolute right-3 flex items-center gap-1 text-[10px] text-ink-muted font-mono bg-surface dark:bg-[#162235] px-1.5 py-0.5 rounded border border-border pointer-events-none select-none">
                <span>/</span>
              </div>
            )}
          </div>

          {/* Desktop Search Results Dropdown */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 mt-2 bg-surface dark:bg-[#162235] border border-border rounded-2xl shadow-dropdown z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="px-3.5 py-2 border-b border-border text-[10px] font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between">
                <span>
                  {query.trim()
                    ? `Results for "${query.trim()}" (${filteredResults.length})`
                    : "Suggested Quick Navigation"}
                </span>
                <span className="text-[10px] font-normal lowercase">esc to close</span>
              </div>

              <div className="max-h-80 overflow-y-auto py-1">
                {filteredResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-ink-secondary">
                    <AlertCircle className="w-6 h-6 text-ink-muted mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-ink-primary">No results found</p>
                    <p className="text-[11px] text-ink-muted mt-1">
                      No matching brand guidelines, rules, or submissions found for &quot;{query}&quot;.
                    </p>
                  </div>
                ) : (
                  filteredResults.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectResult(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full px-3.5 py-2.5 text-left flex items-start gap-3 transition-colors ${
                          isSelected
                            ? "bg-workspace dark:bg-[#1E2D42] text-ink-primary"
                            : "hover:bg-workspace dark:hover:bg-[#1E2D42]/60 text-ink-secondary"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-workspace dark:bg-[#111C2E] border border-border">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-semibold text-ink-primary truncate">
                              {item.title}
                            </h4>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                                  item.badgeColor || "bg-workspace border-border text-ink-muted"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-ink-muted truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })
                )}
              </div>

              <div className="px-3.5 py-2 bg-workspace dark:bg-[#0F172A] border-t border-border flex items-center justify-between text-[11px] text-ink-muted">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-surface dark:bg-[#162235] border border-border font-mono text-[10px]">
                    ↑↓
                  </kbd>{" "}
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-surface dark:bg-[#162235] border border-border font-mono text-[10px]">
                    ↵
                  </kbd>{" "}
                  to select
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------
          Mobile Search Toggle Button (< md screens)
          ---------------------------------------------------- */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => {
            setIsMobileSearchOpen(true);
            setTimeout(() => mobileInputRef.current?.focus(), 100);
          }}
          aria-label="Open search dialog"
          className="p-2 rounded-lg border border-border bg-workspace hover:bg-surface text-ink-secondary hover:text-ink-primary transition shadow-subtle"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* ----------------------------------------------------
          Mobile Full-Width Search Modal Overlay
          ---------------------------------------------------- */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 md:hidden flex flex-col justify-start">
          <div className="bg-surface dark:bg-[#162235] border border-border rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                  }}
                  placeholder="Search guidelines, rules, audits..."
                  className="w-full bg-workspace dark:bg-[#111C2E] border border-border rounded-xl pl-9 pr-8 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-teal"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 p-1 text-ink-muted"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="text-xs font-semibold text-ink-secondary px-2.5 py-2 hover:text-ink-primary"
              >
                Cancel
              </button>
            </div>

            {/* Mobile Results */}
            <div className="max-h-72 overflow-y-auto space-y-1">
              {filteredResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-muted">
                  No matching guidelines or rules found.
                </div>
              ) : (
                filteredResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full p-2.5 text-left rounded-xl hover:bg-workspace dark:hover:bg-[#1E2D42] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-primary truncate">{item.title}</p>
                      <p className="text-[11px] text-ink-muted truncate">{item.subtitle}</p>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-workspace border border-border text-ink-muted shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

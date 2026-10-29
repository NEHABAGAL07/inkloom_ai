"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "inkloom_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
  const [mounted, setMounted] = useState(false);

  // Apply theme class to document root
  const applyTheme = useCallback((targetTheme: ResolvedTheme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (targetTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.setAttribute("data-theme", targetTheme);
    setResolvedTheme(targetTheme);
  }, []);

  // Determine resolved theme based on preference
  const resolveTheme = useCallback((pref: ThemeMode): ResolvedTheme => {
    if (typeof window === "undefined") return "dark";
    if (pref === "dark") return "dark";
    if (pref === "light") return "light";
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }, []);

  // Initialize from storage or system on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      const initialPref: ThemeMode =
        stored === "light" || stored === "dark" || stored === "system" ? stored : "dark";
      setThemeState(initialPref);
      const resolved = resolveTheme(initialPref);
      applyTheme(resolved);
    } catch {
      applyTheme("dark");
    }
    setMounted(true);
  }, [applyTheme, resolveTheme]);

  // Listen to system changes if theme is "system"
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      applyTheme(mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch (e) {
        console.warn("Unable to persist theme to localStorage:", e);
      }
      const resolved = resolveTheme(newTheme);
      applyTheme(resolved);
    },
    [applyTheme, resolveTheme]
  );

  const toggleTheme = useCallback(() => {
    // Check current DOM state to guarantee reliable toggle without sync lag
    const isCurrentlyDark =
      typeof document !== "undefined"
        ? document.documentElement.classList.contains("dark")
        : resolvedTheme === "dark";
    const nextTheme: ResolvedTheme = isCurrentlyDark ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Accessible Global Theme Toggle Button
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`w-8 h-8 rounded-lg border border-border bg-workspace opacity-60 ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-ink-secondary hover:text-ink-primary transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF7A36] shadow-subtle ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#FFD84D] animate-in fade-in zoom-in-75 duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 animate-in fade-in zoom-in-75 duration-200" />
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
}

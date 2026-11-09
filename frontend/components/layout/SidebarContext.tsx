"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  isMobileDrawerOpen: boolean;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleMobileDrawer: () => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (collapsed: boolean) => void;
  toggleDesktopCollapsed: () => void;
  menuTriggerRef: React.RefObject<HTMLButtonElement | null>;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const pathname = usePathname();
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  // Restore collapsed preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("inkloom_sidebar_collapsed");
      if (stored !== null) {
        setIsDesktopCollapsed(stored === "true");
      }
    }
  }, []);

  // Save collapsed preference to localStorage
  const handleSetDesktopCollapsed = useCallback((collapsed: boolean) => {
    setIsDesktopCollapsed(collapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem("inkloom_sidebar_collapsed", String(collapsed));
    }
  }, []);

  const toggleDesktopCollapsed = useCallback(() => {
    handleSetDesktopCollapsed(!isDesktopCollapsed);
  }, [isDesktopCollapsed, handleSetDesktopCollapsed]);

  const openMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(true);
  }, []);

  const closeMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen(false);
  }, []);

  const toggleMobileDrawer = useCallback(() => {
    setIsMobileDrawerOpen((prev) => !prev);
  }, []);

  // Global keyboard shortcut '[' to toggle desktop sidebar (unless typing in input/textarea)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "[" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        toggleDesktopCollapsed();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleDesktopCollapsed]);

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll and handle Escape key when mobile drawer is open
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isMobileDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsMobileDrawerOpen(false);
          // Restore focus to menu trigger button
          menuTriggerRef.current?.focus();
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isMobileDrawerOpen]);

  return (
    <SidebarContext.Provider
      value={{
        isMobileDrawerOpen,
        openMobileDrawer,
        closeMobileDrawer,
        toggleMobileDrawer,
        isDesktopCollapsed,
        setIsDesktopCollapsed: handleSetDesktopCollapsed,
        toggleDesktopCollapsed,
        menuTriggerRef,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

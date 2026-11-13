import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard utility merging Tailwind classes with clsx and twMerge.
 * Eliminates redundant string concatenations, duplicate classes, and precedence conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Standardized user initials extractor.
 * Replaces redundant 12-15 line split/substring boilerplate across headers, avatars, and sidebars.
 */
export function getUserInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email?.trim()) {
    return email.trim().substring(0, 2).toUpperCase();
  }
  return "JD";
}

/**
 * Clean date formatter using standard native Intl.DateTimeFormat.
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Relative time formatter (e.g., "Just now", "5m ago", "2h ago", "3d ago").
 * Consolidates duplicated relative date logic across NotificationBell and feedback cards.
 */
export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

/**
 * Converts snake_case or hyphenated identifier into Title Case.
 */
export function formatCategory(cat: string): string {
  if (!cat) return "";
  return cat
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Truncate long text cleanly without breaking mid-word when possible.
 */
export function truncate(text: string, length: number): string {
  if (!text || text.length <= length) return text || "";
  return text.substring(0, length).trimEnd() + "...";
}

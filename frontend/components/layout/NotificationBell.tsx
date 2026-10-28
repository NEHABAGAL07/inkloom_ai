"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { NotificationItem } from "@/types";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  ExternalLink,
  Check,
  Clock,
} from "lucide-react";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (e) {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (e) {
        // ignore
      }
    }
    setIsOpen(false);
    if (notif.link_url) {
      router.push(notif.link_url);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "changes_requested":
      case "rejected":
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case "review_requested":
      case "review_assigned":
      default:
        return <ClipboardCheck className="w-4 h-4 text-teal shrink-0" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return "Just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        id="notification-bell-button"
        aria-label="Workflow Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl border border-border/60 hover:border-border hover:bg-workspace dark:hover:bg-[#162235] text-ink-muted hover:text-ink-primary transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-slate-900 shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="region"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-surface dark:bg-[#162235] border border-border rounded-2xl shadow-dropdown p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-border/60">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-ink-primary uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal/20 text-teal-700 dark:text-teal-300 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-teal hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                No notifications yet. You're completely up to date!
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                    !notif.is_read
                      ? "bg-teal/5 dark:bg-teal-950/20 border-teal/30 hover:border-teal/60"
                      : "bg-workspace/50 dark:bg-[#101A2B]/40 border-border/40 hover:border-border hover:bg-workspace"
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="mt-0.5">{getNotifIcon(notif.notification_type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-ink-primary truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-ink-muted whitespace-nowrap flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 mt-2 border-t border-border/60 text-center">
            <Link
              href="/campaigns"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-teal hover:underline inline-flex items-center gap-1"
            >
              View Campaign Workspaces <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { User, OrgMembership, Organization } from "@/types";
import { api, setApiAuthToken, setApiTenantId, ApiError } from "./api";

// Configurable session policy: 60 minutes of inactivity timeout
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
// Absolute session boundary: 24 hours
const ABSOLUTE_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  activeOrgId: string | null;
  activeOrgName: string | null;
  activeRole: string | null;
  memberships: OrgMembership[];
  organizations: Organization[];
  isLoading: boolean;
  isAuthenticated: boolean;
  backendError: string | null;
  isBackendAvailable: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; organization_name: string; industry?: string }) => Promise<void>;
  acceptInvite: (token: string, full_name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  retryAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [activeOrgName, setActiveOrgName] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setActiveOrgId(null);
    setActiveOrgName(null);
    setActiveRole(null);
    setMemberships([]);
    setOrganizations([]);
    setApiAuthToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("inkloom_token");
      localStorage.removeItem("inkloom_tenant_id");
      localStorage.removeItem("inkloom_mock_user");
      sessionStorage.clear();
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (err: any) {
      console.warn("Server session revocation notice:", err);
      const isAlreadyInvalid = err instanceof ApiError && (err.status === 401 || err.status === 403);
      if (!isAlreadyInvalid) {
        // Safe error handling: do not falsely report successful sign-out on server/network failure
        throw err;
      }
    }
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, [clearSession]);

  // Check inactivity & absolute lifetime
  const checkSessionExpiry = useCallback(() => {
    if (typeof window === "undefined") return;
    const sessionStart = sessionStorage.getItem("inkloom_session_start");
    const lastActive = sessionStorage.getItem("inkloom_last_active");
    const now = Date.now();

    if (sessionStart && now - parseInt(sessionStart, 10) > ABSOLUTE_SESSION_LIFETIME_MS) {
      console.warn("Session exceeded maximum absolute lifetime (24 hours).");
      logout();
      return;
    }

    if (lastActive && now - parseInt(lastActive, 10) > INACTIVITY_TIMEOUT_MS) {
      console.warn("Session expired due to 60 minutes of inactivity.");
      logout();
      return;
    }

    sessionStorage.setItem("inkloom_last_active", now.toString());
  }, [logout]);

  // Track user activity to update inactivity heartbeat
  useEffect(() => {
    if (!user) return;

    const recordActivity = () => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("inkloom_last_active", Date.now().toString());
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, recordActivity, { passive: true }));

    // Periodic heartbeat check every 2 minutes
    inactivityTimerRef.current = setInterval(() => {
      checkSessionExpiry();
    }, 2 * 60 * 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, recordActivity));
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
    };
  }, [user, checkSessionExpiry]);

  // Core initialization routine with deduplication and error distinction
  const initAuth = useCallback(
    async (isRetry: boolean = false) => {
      if (initPromiseRef.current && !isRetry) {
        return initPromiseRef.current;
      }

      const task = (async () => {
        setIsLoading(true);
        setBackendError(null);
        try {
          const storedToken = typeof window !== "undefined" ? localStorage.getItem("inkloom_token") : null;
          const storedTenant = typeof window !== "undefined" ? localStorage.getItem("inkloom_tenant_id") : null;

          if (storedTenant) {
            setActiveOrgId(storedTenant);
            setApiTenantId(storedTenant);
          }

          if (storedToken) {
            setApiAuthToken(storedToken);
          }

          // Verify session with server (/auth/me with cookie or token)
          const currentUserData = await api.getCurrentUser();
          if (!isMountedRef.current) return;

          if (currentUserData && currentUserData.user) {
            setUser(currentUserData.user);
            setActiveOrgId(currentUserData.active_organization_id);
            setActiveRole(currentUserData.active_role);
            setMemberships(currentUserData.memberships || []);

            const activeM = currentUserData.memberships?.find(
              (m) => m.organization_id === currentUserData.active_organization_id
            );
            if (activeM) {
              setActiveOrgName(activeM.organization_name);
            }

            if (typeof window !== "undefined") {
              if (!sessionStorage.getItem("inkloom_session_start")) {
                sessionStorage.setItem("inkloom_session_start", Date.now().toString());
              }
              sessionStorage.setItem("inkloom_last_active", Date.now().toString());
            }
          } else {
            // Token expired, revoked, or absent
            clearSession();
          }
        } catch (err: any) {
          if (!isMountedRef.current) return;
          const storedToken = typeof window !== "undefined" ? localStorage.getItem("inkloom_token") : null;
          if (storedToken && err instanceof ApiError && (err.isNetworkError || err.status >= 500)) {
            console.warn("Backend governance service unavailable:", err.message);
            setBackendError(
              err.message || "Unable to reach Inkloom brand governance service at http://localhost:8000."
            );
          } else {
            console.warn("Auth initialization fallback:", err);
            clearSession();
          }
        } finally {
          if (isMountedRef.current) {
            setIsLoading(false);
          }
          initPromiseRef.current = null;
        }
      })();

      initPromiseRef.current = task;
      return task;
    },
    [clearSession]
  );

  // Initialize and check current user on mount
  useEffect(() => {
    isMountedRef.current = true;
    initAuth();
    return () => {
      isMountedRef.current = false;
    };
  }, [initAuth]);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    try {
      const authRes = await api.login(email, password);
      setUser(authRes.user);
      setActiveOrgId(authRes.active_organization_id);
      setActiveRole(authRes.active_role);
      setMemberships(authRes.memberships || []);

      const activeM = authRes.memberships?.find(
        (m) => m.organization_id === authRes.active_organization_id
      );
      setActiveOrgName(activeM ? activeM.organization_name : "Active Workspace");

      setApiAuthToken(authRes.access_token);
      setApiTenantId(authRes.active_organization_id);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("inkloom_session_start", Date.now().toString());
        sessionStorage.setItem("inkloom_last_active", Date.now().toString());
        if (!rememberMe) {
          // If not remember me, keep session confined to sessionStorage
          localStorage.removeItem("inkloom_token");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    organization_name: string;
    industry?: string;
  }) => {
    setIsLoading(true);
    try {
      const authRes = await api.register(data);
      setUser(authRes.user);
      setActiveOrgId(authRes.active_organization_id);
      setActiveRole(authRes.active_role);
      setMemberships(authRes.memberships || []);

      const activeM = authRes.memberships?.find(
        (m) => m.organization_id === authRes.active_organization_id
      );
      setActiveOrgName(activeM ? activeM.organization_name : data.organization_name);

      setApiAuthToken(authRes.access_token);
      setApiTenantId(authRes.active_organization_id);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("inkloom_session_start", Date.now().toString());
        sessionStorage.setItem("inkloom_last_active", Date.now().toString());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvite = async (token: string, full_name: string, password: string) => {
    setIsLoading(true);
    try {
      const authRes = await api.acceptInvitation({ token, full_name, password });
      setUser(authRes.user);
      setActiveOrgId(authRes.active_organization_id);
      setActiveRole(authRes.active_role);
      setMemberships(authRes.memberships || []);

      const activeM = authRes.memberships?.find(
        (m) => m.organization_id === authRes.active_organization_id
      );
      setActiveOrgName(activeM ? activeM.organization_name : "Active Workspace");

      setApiAuthToken(authRes.access_token);
      setApiTenantId(authRes.active_organization_id);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("inkloom_session_start", Date.now().toString());
        sessionStorage.setItem("inkloom_last_active", Date.now().toString());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    const mem = memberships.find((m) => m.organization_id === orgId);
    if (!mem) return;

    try {
      // Call server-side verified switch
      const res = await api.switchOrganization(orgId);
      setActiveOrgId(res.active_organization_id);
      setActiveRole(res.active_role);
      setMemberships(res.memberships || []);

      const switchedM = res.memberships?.find((m) => m.organization_id === res.active_organization_id);
      setActiveOrgName(switchedM ? switchedM.organization_name : mem.organization_name);

      setApiTenantId(res.active_organization_id);
      setApiAuthToken(res.access_token);

      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (err) {
      console.warn("Server-side switchOrganization failed, applying verified client session:", err);
      setActiveOrgId(orgId);
      setActiveOrgName(mem.organization_name);
      setActiveRole(mem.role);
      setApiTenantId(orgId);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

  const refreshUser = async () => {
    try {
      const currentUserData = await api.getCurrentUser();
      if (currentUserData && currentUserData.user) {
        setUser(currentUserData.user);
        setActiveOrgId(currentUserData.active_organization_id);
        setActiveRole(currentUserData.active_role);
        setMemberships(currentUserData.memberships || []);
        const activeM = currentUserData.memberships?.find(
          (m) => m.organization_id === currentUserData.active_organization_id
        );
        if (activeM) setActiveOrgName(activeM.organization_name);
      }
    } catch (err) {
      console.warn("Refresh user failed:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrgId,
        activeOrgName,
        activeRole,
        memberships,
        organizations,
        isLoading,
        isAuthenticated: !!user,
        backendError,
        isBackendAvailable: !backendError,
        login,
        register,
        acceptInvite,
        logout,
        switchOrganization,
        refreshUser,
        retryAuth: () => initAuth(true),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

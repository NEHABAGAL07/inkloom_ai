"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, OrgMembership, Organization } from "@/types";
import { api, setApiAuthToken, setApiTenantId } from "./api";

interface AuthContextType {
  user: User | null;
  activeOrgId: string | null;
  activeOrgName: string | null;
  activeRole: string | null;
  memberships: OrgMembership[];
  organizations: Organization[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; organization_name: string; industry?: string }) => Promise<void>;
  acceptInvite: (token: string, full_name: string, password: string) => Promise<void>;
  logout: () => void;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
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

  // Initialize and check current user
  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = localStorage.getItem("inkloom_token");
        const storedTenant = localStorage.getItem("inkloom_tenant_id");

        if (storedTenant) {
          setActiveOrgId(storedTenant);
          setApiTenantId(storedTenant);
        }

        if (storedToken) {
          setApiAuthToken(storedToken);
          const currentUserData = await api.getCurrentUser();
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
          }
        }
      } catch (err) {
        console.warn("Auth initialization fallback:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
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
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
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
    }
  };

  const switchOrganization = async (orgId: string) => {
    const mem = memberships.find((m) => m.organization_id === orgId);
    if (!mem) return;

    setActiveOrgId(orgId);
    setActiveOrgName(mem.organization_name);
    setActiveRole(mem.role);
    setApiTenantId(orgId);

    if (typeof window !== "undefined") {
      window.location.reload();
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
        login,
        register,
        acceptInvite,
        logout,
        switchOrganization,
        refreshUser,
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

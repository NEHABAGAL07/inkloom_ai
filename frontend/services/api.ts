/**
 * Unified API Client for Inkloom AI Brand Governance
 * Implements IApiService with dynamic JWT authentication & tenant scoping.
 * Automatically falls back to MockApiService if NEXT_PUBLIC_USE_MOCK=true or backend is unavailable.
 */
import {
  IApiService,
  CreateSubmissionInput,
  ReviewDecisionInput,
  mockApi,
} from "./mock-api";
import {
  AuditResult,
  ContentSubmission,
  ReviewDecision,
  BrandGuideline,
  BrandGuidelineProfile,
  BrandGuidelineData,
  BrandGuidelineVersionInfo,
  EffectiveSettings,
  ApprovedAsset,
  AnalyticsSummary,
  User,
  Organization,
  OrgMembership,
  AuthResponse,
  MemberInfo,
  Invitation,
  PublicInvitation,
  ClarificationReport,
  ConflictCheckResult,
  StarterTemplateRule,
} from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

let activeToken: string | null = null;
let activeTenantId: string = "org_acme_cloud";

// Initialize client-side state from localStorage
if (typeof window !== "undefined") {
  activeToken = localStorage.getItem("inkloom_token");
  const storedTenant = localStorage.getItem("inkloom_tenant_id");
  if (storedTenant) activeTenantId = storedTenant;
}

export function setApiAuthToken(token: string | null) {
  activeToken = token;
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("inkloom_token", token);
    else localStorage.removeItem("inkloom_token");
  }
}

export function setApiTenantId(tenantId: string) {
  activeTenantId = tenantId;
  if (typeof window !== "undefined") {
    localStorage.setItem("inkloom_tenant_id", tenantId);
  }
}

export function getApiTenantId(): string {
  return activeTenantId;
}

export class ApiService implements IApiService {
  private async fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Tenant-Id": activeTenantId,
      ...(options?.headers as Record<string, string> || {}),
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errBody.detail || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  // --- Submissions ---
  async getSubmissions(): Promise<ContentSubmission[]> {
    if (USE_MOCK) return mockApi.getSubmissions();
    try {
      return await this.fetchJson<ContentSubmission[]>("/submissions");
    } catch {
      return mockApi.getSubmissions();
    }
  }

  async getSubmission(id: string): Promise<ContentSubmission> {
    if (USE_MOCK) return mockApi.getSubmission(id);
    try {
      return await this.fetchJson<ContentSubmission>(`/submissions/${id}`);
    } catch {
      return mockApi.getSubmission(id);
    }
  }

  async createSubmission(data: CreateSubmissionInput): Promise<ContentSubmission> {
    if (USE_MOCK) {
      const res = await mockApi.createSubmission(data);
      await mockApi.triggerAudit(res.id);
      return res;
    }
    try {
      const res = await this.fetchJson<ContentSubmission>("/submissions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await this.triggerAudit(res.id).catch((err) => console.warn("Auto-audit trigger warning:", err));
      return res;
    } catch {
      const mockRes = await mockApi.createSubmission(data);
      await mockApi.triggerAudit(mockRes.id);
      return mockRes;
    }
  }

  // --- Audits ---
  async triggerAudit(submissionId: string, revisionId?: string): Promise<AuditResult> {
    if (USE_MOCK) return mockApi.triggerAudit(submissionId, revisionId);
    try {
      return await this.fetchJson<AuditResult>("/audits/trigger", {
        method: "POST",
        body: JSON.stringify({ submission_id: submissionId, revision_id: revisionId }),
      });
    } catch {
      return mockApi.triggerAudit(submissionId, revisionId);
    }
  }

  async getAudit(auditId: string): Promise<AuditResult> {
    if (USE_MOCK) return mockApi.getAudit(auditId);
    try {
      return await this.fetchJson<AuditResult>(`/audits/${auditId}`);
    } catch {
      return mockApi.getAudit(auditId);
    }
  }

  // --- Reviews ---
  async getPendingReviews(): Promise<ContentSubmission[]> {
    if (USE_MOCK) return mockApi.getPendingReviews();
    try {
      return await this.fetchJson<ContentSubmission[]>("/reviews/pending");
    } catch {
      return mockApi.getPendingReviews();
    }
  }

  async submitReviewDecision(data: ReviewDecisionInput): Promise<ReviewDecision> {
    if (USE_MOCK) return mockApi.submitReviewDecision(data);
    try {
      return await this.fetchJson<ReviewDecision>("/reviews/decide", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      return mockApi.submitReviewDecision(data);
    }
  }

  // --- Guidelines & Assets ---
  async getGuidelines(): Promise<BrandGuideline[]> {
    if (USE_MOCK) return mockApi.getGuidelines();
    try {
      return await this.fetchJson<BrandGuideline[]>("/guidelines");
    } catch {
      return mockApi.getGuidelines();
    }
  }

  async createGuideline(data: { name: string; description?: string; version?: string }): Promise<BrandGuideline> {
    if (USE_MOCK) return mockApi.createGuideline(data);
    try {
      return await this.fetchJson<BrandGuideline>("/guidelines", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          description: data.description || "",
          version: data.version || "1.0.0",
          is_active: true,
          rules: [],
        }),
      });
    } catch {
      return mockApi.createGuideline(data);
    }
  }

  async getGuidelineProfile(): Promise<BrandGuidelineProfile> {
    if (USE_MOCK) return mockApi.getGuidelineProfile();
    try {
      return await this.fetchJson<BrandGuidelineProfile>("/guidelines/profile");
    } catch {
      return mockApi.getGuidelineProfile();
    }
  }

  async saveDraftGuideline(draftData: BrandGuidelineData, name?: string, description?: string): Promise<BrandGuidelineProfile> {
    if (USE_MOCK) return mockApi.saveDraftGuideline(draftData, name, description);
    try {
      return await this.fetchJson<BrandGuidelineProfile>("/guidelines/draft", {
        method: "PUT",
        body: JSON.stringify({ draft_data: draftData, name, description }),
      });
    } catch {
      return mockApi.saveDraftGuideline(draftData, name, description);
    }
  }

  async publishGuideline(version: string, changelog?: string): Promise<BrandGuidelineProfile> {
    if (USE_MOCK) return mockApi.publishGuideline(version, changelog);
    try {
      return await this.fetchJson<BrandGuidelineProfile>("/guidelines/publish", {
        method: "POST",
        body: JSON.stringify({ version, changelog }),
      });
    } catch {
      return mockApi.publishGuideline(version, changelog);
    }
  }

  async submitGuidelineForReview(notes: string, requiresLegalApproval: boolean = true, jurisdiction?: string, industry?: string): Promise<BrandGuidelineProfile> {
    if (USE_MOCK) return mockApi.submitGuidelineForReview(notes, requiresLegalApproval, jurisdiction, industry);
    try {
      return await this.fetchJson<BrandGuidelineProfile>("/guidelines/submit-for-review", {
        method: "POST",
        body: JSON.stringify({
          submission_notes: notes,
          requires_legal_approval: requiresLegalApproval,
          jurisdiction,
          industry,
        }),
      });
    } catch {
      return mockApi.submitGuidelineForReview(notes, requiresLegalApproval, jurisdiction, industry);
    }
  }

  async getPendingGuidelineReviews(): Promise<BrandGuidelineProfile[]> {
    if (USE_MOCK) return mockApi.getPendingGuidelineReviews();
    try {
      return await this.fetchJson<BrandGuidelineProfile[]>("/guidelines/pending-review");
    } catch {
      return mockApi.getPendingGuidelineReviews();
    }
  }

  async recordGuidelineReviewDecision(decision: "approved" | "rejected" | "changes_requested", rationale: string): Promise<BrandGuidelineProfile> {
    if (USE_MOCK) return mockApi.recordGuidelineReviewDecision(decision, rationale);
    try {
      return await this.fetchJson<BrandGuidelineProfile>("/guidelines/review-decision", {
        method: "POST",
        body: JSON.stringify({ decision, rationale }),
      });
    } catch {
      return mockApi.recordGuidelineReviewDecision(decision, rationale);
    }
  }

  async checkGuidelineConflicts(): Promise<ConflictCheckResult> {
    if (USE_MOCK) return mockApi.checkGuidelineConflicts();
    try {
      return await this.fetchJson<ConflictCheckResult>("/guidelines/conflict-check", {
        method: "POST",
      });
    } catch {
      return mockApi.checkGuidelineConflicts();
    }
  }

  async getStarterTemplates(jurisdiction: string = "all", industry: string = "all"): Promise<{ total_templates: number; templates: StarterTemplateRule[]; compliance_disclaimer: string }> {
    if (USE_MOCK) return mockApi.getStarterTemplates(jurisdiction, industry);
    try {
      return await this.fetchJson<{ total_templates: number; templates: StarterTemplateRule[]; compliance_disclaimer: string }>(
        `/guidelines/starter-templates?jurisdiction=${encodeURIComponent(jurisdiction)}&industry=${encodeURIComponent(industry)}`
      );
    } catch {
      return mockApi.getStarterTemplates(jurisdiction, industry);
    }
  }

  async reportUnclearRule(ruleReference: string, reportType: string, description: string): Promise<ClarificationReport> {
    if (USE_MOCK) return mockApi.reportUnclearRule(ruleReference, reportType, description);
    try {
      return await this.fetchJson<ClarificationReport>("/guidelines/report-unclear", {
        method: "POST",
        body: JSON.stringify({
          rule_reference: ruleReference,
          report_type: reportType,
          description,
        }),
      });
    } catch {
      return mockApi.reportUnclearRule(ruleReference, reportType, description);
    }
  }

  async getClarificationReports(): Promise<ClarificationReport[]> {
    if (USE_MOCK) return mockApi.getClarificationReports();
    try {
      return await this.fetchJson<ClarificationReport[]>("/guidelines/reports");
    } catch {
      return mockApi.getClarificationReports();
    }
  }

  async resolveClarificationReport(reportId: string, status: "resolved" | "dismissed", resolutionNotes: string): Promise<ClarificationReport> {
    if (USE_MOCK) return mockApi.resolveClarificationReport(reportId, status, resolutionNotes);
    try {
      return await this.fetchJson<ClarificationReport>(`/guidelines/reports/${reportId}`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          resolution_notes: resolutionNotes,
        }),
      });
    } catch {
      return mockApi.resolveClarificationReport(reportId, status, resolutionNotes);
    }
  }

  async rollbackGuideline(versionId: string, rationale: string): Promise<BrandGuidelineProfile> {
    if (USE_MOCK) return mockApi.rollbackGuideline(versionId, rationale);
    try {
      return await this.fetchJson<BrandGuidelineProfile>("/guidelines/rollback", {
        method: "POST",
        body: JSON.stringify({ version_id: versionId, rationale }),
      });
    } catch {
      return mockApi.rollbackGuideline(versionId, rationale);
    }
  }

  async getGuidelineVersions(): Promise<BrandGuidelineVersionInfo[]> {
    if (USE_MOCK) return mockApi.getGuidelineVersions();
    try {
      return await this.fetchJson<BrandGuidelineVersionInfo[]>("/guidelines/versions");
    } catch {
      return mockApi.getGuidelineVersions();
    }
  }

  async restoreGuidelineVersion(versionId: string): Promise<BrandGuidelineProfile> {
    if (USE_MOCK) return mockApi.restoreGuidelineVersion(versionId);
    try {
      return await this.fetchJson<BrandGuidelineProfile>(`/guidelines/versions/${versionId}/restore`, {
        method: "POST",
      });
    } catch {
      return mockApi.restoreGuidelineVersion(versionId);
    }
  }

  async getEffectiveSettings(mediaType: string): Promise<EffectiveSettings> {
    if (USE_MOCK) return mockApi.getEffectiveSettings(mediaType);
    try {
      return await this.fetchJson<EffectiveSettings>(`/guidelines/effective?media_type=${encodeURIComponent(mediaType)}`);
    } catch {
      return mockApi.getEffectiveSettings(mediaType);
    }
  }

  async getAssets(): Promise<ApprovedAsset[]> {
    if (USE_MOCK) return mockApi.getAssets();
    try {
      return await this.fetchJson<ApprovedAsset[]>("/assets");
    } catch {
      return mockApi.getAssets();
    }
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    if (USE_MOCK) return mockApi.getAnalyticsSummary();
    try {
      return await this.fetchJson<AnalyticsSummary>("/analytics/summary");
    } catch {
      return mockApi.getAnalyticsSummary();
    }
  }

  // --- Authentication ---
  async login(email: string, password: string): Promise<AuthResponse> {
    if (USE_MOCK) {
      const mockRes = await mockApi.login(email, password);
      setApiAuthToken(mockRes.access_token);
      setApiTenantId(mockRes.active_organization_id);
      return mockRes;
    }
    try {
      const res = await this.fetchJson<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setApiAuthToken(res.access_token);
      setApiTenantId(res.active_organization_id);
      return res;
    } catch (err: any) {
      console.warn("Backend auth unavailable or failed, seamlessly using demo mock session:", err?.message || err);
      const mockRes = await mockApi.login(email, password);
      setApiAuthToken(mockRes.access_token);
      setApiTenantId(mockRes.active_organization_id);
      return mockRes;
    }
  }

  async register(data: { email: string; password: string; full_name: string; organization_name: string; industry?: string }): Promise<AuthResponse> {
    if (USE_MOCK) {
      const mockRes = await mockApi.register(data);
      setApiAuthToken(mockRes.access_token);
      setApiTenantId(mockRes.active_organization_id);
      return mockRes;
    }
    try {
      const res = await this.fetchJson<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setApiAuthToken(res.access_token);
      setApiTenantId(res.active_organization_id);
      return res;
    } catch (err: any) {
      console.warn("Backend registration unavailable or failed, using demo mock registration:", err?.message || err);
      const mockRes = await mockApi.register(data);
      setApiAuthToken(mockRes.access_token);
      setApiTenantId(mockRes.active_organization_id);
      return mockRes;
    }
  }

  async getCurrentUser(): Promise<{ user: User; active_organization_id: string; active_role: string; memberships: OrgMembership[] }> {
    if (USE_MOCK) return mockApi.getCurrentUser();
    try {
      return await this.fetchJson<{ user: User; active_organization_id: string; active_role: string; memberships: OrgMembership[] }>("/auth/me");
    } catch {
      return mockApi.getCurrentUser();
    }
  }

  async logout(): Promise<{ message: string; revoked: boolean }> {
    if (USE_MOCK) return mockApi.logout();
    return await this.fetchJson<{ message: string; revoked: boolean }>("/auth/logout", {
      method: "POST",
    });
  }


  // --- Organizations ---
  async getOrganizations(): Promise<Organization[]> {
    if (USE_MOCK) return mockApi.getOrganizations();
    try {
      return await this.fetchJson<Organization[]>("/organizations");
    } catch {
      return mockApi.getOrganizations();
    }
  }

  async createOrganization(data: { name: string; industry?: string; description?: string; website?: string }): Promise<Organization> {
    if (USE_MOCK) return mockApi.createOrganization(data);
    return await this.fetchJson<Organization>("/organizations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getOrganization(orgId: string): Promise<Organization> {
    if (USE_MOCK) return mockApi.getOrganization(orgId);
    try {
      return await this.fetchJson<Organization>(`/organizations/${orgId}`);
    } catch {
      return mockApi.getOrganization(orgId);
    }
  }

  async updateOrganization(orgId: string, data: Partial<Organization>): Promise<Organization> {
    if (USE_MOCK) return mockApi.updateOrganization(orgId, data);
    return await this.fetchJson<Organization>(`/organizations/${orgId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // --- Members & Roles ---
  async getMembers(orgId: string): Promise<MemberInfo[]> {
    if (USE_MOCK) return mockApi.getMembers(orgId);
    try {
      return await this.fetchJson<MemberInfo[]>(`/organizations/${orgId}/members`);
    } catch {
      return mockApi.getMembers(orgId);
    }
  }

  async updateMemberRole(orgId: string, userId: string, role: string): Promise<MemberInfo> {
    if (USE_MOCK) return mockApi.updateMemberRole(orgId, userId, role);
    return await this.fetchJson<MemberInfo>(`/organizations/${orgId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(orgId: string, userId: string): Promise<void> {
    if (USE_MOCK) return mockApi.removeMember(orgId, userId);
    await this.fetchJson<void>(`/organizations/${orgId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  // --- Invitations ---
  async getInvitations(orgId: string): Promise<Invitation[]> {
    if (USE_MOCK) return mockApi.getInvitations(orgId);
    try {
      return await this.fetchJson<Invitation[]>(`/organizations/${orgId}/invitations`);
    } catch {
      return mockApi.getInvitations(orgId);
    }
  }

  async createInvitation(orgId: string, email: string, role: string): Promise<Invitation> {
    if (USE_MOCK) return mockApi.createInvitation(orgId, email, role);
    return await this.fetchJson<Invitation>(`/organizations/${orgId}/invitations`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  }

  async revokeInvitation(orgId: string, inviteId: string): Promise<void> {
    if (USE_MOCK) return mockApi.revokeInvitation(orgId, inviteId);
    await this.fetchJson<void>(`/organizations/${orgId}/invitations/${inviteId}`, {
      method: "DELETE",
    });
  }

  async inspectInvitation(token: string): Promise<PublicInvitation> {
    if (USE_MOCK) return mockApi.inspectInvitation(token);
    try {
      return await this.fetchJson<PublicInvitation>(`/invitations/${token}`);
    } catch {
      return mockApi.inspectInvitation(token);
    }
  }

  async acceptInvitation(data: { token: string; full_name: string; password: string }): Promise<AuthResponse> {
    if (USE_MOCK) {
      const mockRes = await mockApi.acceptInvitation(data);
      setApiAuthToken(mockRes.access_token);
      setApiTenantId(mockRes.active_organization_id);
      return mockRes;
    }
    try {
      const res = await this.fetchJson<AuthResponse>("/invitations/accept", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setApiAuthToken(res.access_token);
      setApiTenantId(res.active_organization_id);
      return res;
    } catch (err: any) {
      console.warn("Backend acceptInvitation unavailable, using demo mock:", err?.message || err);
      const mockRes = await mockApi.acceptInvitation(data);
      setApiAuthToken(mockRes.access_token);
      setApiTenantId(mockRes.active_organization_id);
      return mockRes;
    }
  }
}

export const api = new ApiService();
export type { IApiService, CreateSubmissionInput, ReviewDecisionInput };

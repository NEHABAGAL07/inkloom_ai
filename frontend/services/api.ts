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
  ContentComment,
  CommentsListResponse,
  CitationItem,
  AskQuestionRequest,
  AskQuestionResponse,
  ChatMessage,
  ChatSession,
  ChatSessionDetail,
  KnowledgeDocument,
  DocumentListResponse,
  ChatStatusResponse,
  CampaignAdaptation,
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

export class ApiError extends Error {
  status: number;
  isNetworkError: boolean;
  detail?: string;

  constructor(message: string, status: number = 0, isNetworkError: boolean = false, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isNetworkError = isNetworkError;
    this.detail = detail;
  }
}

export class ApiService implements IApiService {
  private async fetchJson<T>(path: string, options?: RequestInit, timeoutMs: number = 10000): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Tenant-Id": activeTenantId,
      ...(options?.headers as Record<string, string> || {}),
    };

    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        ...options,
        headers,
        signal: options?.signal || controller.signal,
      });

      if (!res.ok) {
        let errDetail = res.statusText;
        try {
          const errBody = await res.json();
          errDetail = errBody.detail || errBody.message || res.statusText;
        } catch {}
        throw new ApiError(errDetail || `Request failed with status ${res.status}`, res.status, false, errDetail);
      }
      return await res.json();
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      const isTimeout = err?.name === "AbortError";
      const msg = isTimeout
        ? "Network request timed out. Governance service did not respond in time."
        : (err?.message || "Unable to reach Inkloom brand governance service.");
      throw new ApiError(msg, 0, true, msg);
    } finally {
      clearTimeout(timeoutId);
    }
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

  async createRevision(submissionId: string, data: { raw_text?: string; file_name?: string; file_path?: string; file_size_bytes?: number }): Promise<any> {
    if (USE_MOCK) return mockApi.createRevision(submissionId, data);
    try {
      const res = await this.fetchJson<any>(`/submissions/${submissionId}/revisions`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      this.triggerAudit(submissionId).catch((err) => console.warn("Auto-audit after revision warning:", err));
      return res;
    } catch {
      return mockApi.createRevision(submissionId, data);
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

  // --- Designer Feedback & Change Request Comments ---
  async getSubmissionComments(submissionId: string): Promise<CommentsListResponse> {
    if (USE_MOCK) return mockApi.getSubmissionComments(submissionId);
    try {
      return await this.fetchJson<CommentsListResponse>(`/submissions/${submissionId}/comments`);
    } catch {
      return mockApi.getSubmissionComments(submissionId);
    }
  }

  async addSubmissionComment(submissionId: string, commentText: string, category: string = "visual_design"): Promise<ContentComment> {
    if (USE_MOCK) return mockApi.addSubmissionComment(submissionId, commentText, category);
    try {
      return await this.fetchJson<ContentComment>(`/submissions/${submissionId}/comments`, {
        method: "POST",
        body: JSON.stringify({ comment_text: commentText, category }),
      });
    } catch {
      return mockApi.addSubmissionComment(submissionId, commentText, category);
    }
  }

  async toggleCommentResolution(
    submissionId: string,
    commentId: string,
    isResolved: boolean,
    resolutionNote?: string
  ): Promise<ContentComment> {
    if (USE_MOCK) return mockApi.toggleCommentResolution(submissionId, commentId, isResolved, resolutionNote);
    try {
      return await this.fetchJson<ContentComment>(`/submissions/${submissionId}/comments/${commentId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ is_resolved: isResolved, resolution_note: resolutionNote }),
      });
    } catch {
      return mockApi.toggleCommentResolution(submissionId, commentId, isResolved, resolutionNote);
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
    const res = await this.fetchJson<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setApiAuthToken(res.access_token);
    setApiTenantId(res.active_organization_id);
    return res;
  }

  async register(data: { email: string; password: string; full_name: string; organization_name: string; industry?: string }): Promise<AuthResponse> {
    if (USE_MOCK) {
      const mockRes = await mockApi.register(data);
      setApiAuthToken(mockRes.access_token);
      setApiTenantId(mockRes.active_organization_id);
      return mockRes;
    }
    const res = await this.fetchJson<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setApiAuthToken(res.access_token);
    setApiTenantId(res.active_organization_id);
    return res;
  }

  async switchOrganization(organizationId: string): Promise<AuthResponse> {
    const res = await this.fetchJson<AuthResponse>("/auth/switch-org", {
      method: "POST",
      body: JSON.stringify({ organization_id: organizationId }),
    });
    setApiAuthToken(res.access_token);
    setApiTenantId(res.active_organization_id);
    return res;
  }

  async getCurrentUser(): Promise<{ user: User; active_organization_id: string; active_role: string; memberships: OrgMembership[] } | null> {
    if (USE_MOCK) return mockApi.getCurrentUser();
    try {
      return await this.fetchJson<{ user: User; active_organization_id: string; active_role: string; memberships: OrgMembership[] }>("/auth/me");
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        // Specifically 401 Unauthorized: token expired, invalid, or revoked
        setApiAuthToken(null);
        return null;
      }
      // If network failure, 5xx, or backend down: DO NOT clear token!
      // Rethrow so the caller can display a retryable backend unavailable state.
      throw err;
    }
  }

  async logout(): Promise<{ message: string; revoked: boolean }> {
    if (USE_MOCK) return mockApi.logout();
    try {
      return await this.fetchJson<{ message: string; revoked: boolean }>("/auth/logout", {
        method: "POST",
      });
    } finally {
      setApiAuthToken(null);
    }
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
    const res = await this.fetchJson<AuthResponse>("/invitations/accept", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setApiAuthToken(res.access_token);
    setApiTenantId(res.active_organization_id);
    return res;
  }

  // --- Brand Assistant & Document Intelligence Methods ---
  async askAssistant(payload: AskQuestionRequest): Promise<AskQuestionResponse> {
    if (USE_MOCK) return mockApi.askAssistant(payload);
    try {
      return await this.fetchJson<AskQuestionResponse>("/chat/ask", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      return mockApi.askAssistant(payload);
    }
  }

  async getAssistantSessions(): Promise<ChatSession[]> {
    if (USE_MOCK) return mockApi.getAssistantSessions();
    try {
      return await this.fetchJson<ChatSession[]>("/chat/sessions");
    } catch {
      return mockApi.getAssistantSessions();
    }
  }

  async getAssistantSession(sessionId: string): Promise<ChatSessionDetail> {
    if (USE_MOCK) return mockApi.getAssistantSession(sessionId);
    try {
      return await this.fetchJson<ChatSessionDetail>(`/chat/sessions/${sessionId}`);
    } catch {
      return mockApi.getAssistantSession(sessionId);
    }
  }

  async deleteAssistantSession(sessionId: string): Promise<void> {
    if (USE_MOCK) return mockApi.deleteAssistantSession(sessionId);
    try {
      await this.fetchJson<void>(`/chat/sessions/${sessionId}`, { method: "DELETE" });
    } catch {
      return mockApi.deleteAssistantSession(sessionId);
    }
  }

  async submitMessageFeedback(messageId: string, payload: { helpful: boolean; comment?: string }): Promise<any> {
    if (USE_MOCK) return mockApi.submitMessageFeedback(messageId, payload);
    try {
      return await this.fetchJson<any>(`/chat/messages/${messageId}/feedback`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      return mockApi.submitMessageFeedback(messageId, payload);
    }
  }

  async uploadKnowledgeDocument(file: File): Promise<KnowledgeDocument> {
    if (USE_MOCK) return mockApi.uploadKnowledgeDocument(file);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = `${API_BASE}/documents`;
      const headers: Record<string, string> = {};
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;
      if (activeTenantId) headers["X-Organization-Id"] = activeTenantId;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new ApiError(errorData.detail || "Failed to upload document", res.status, false, errorData.detail);
      }
      return await res.json();
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.uploadKnowledgeDocument(file);
    }
  }

  async getKnowledgeDocuments(): Promise<DocumentListResponse> {
    if (USE_MOCK) return mockApi.getKnowledgeDocuments();
    try {
      return await this.fetchJson<DocumentListResponse>("/documents");
    } catch {
      return mockApi.getKnowledgeDocuments();
    }
  }

  async getKnowledgeDocument(documentId: string): Promise<KnowledgeDocument> {
    if (USE_MOCK) return mockApi.getKnowledgeDocument(documentId);
    try {
      return await this.fetchJson<KnowledgeDocument>(`/documents/${documentId}`);
    } catch {
      return mockApi.getKnowledgeDocument(documentId);
    }
  }

  async deleteKnowledgeDocument(documentId: string): Promise<void> {
    if (USE_MOCK) return mockApi.deleteKnowledgeDocument(documentId);
    try {
      await this.fetchJson<void>(`/documents/${documentId}`, { method: "DELETE" });
    } catch {
      return mockApi.deleteKnowledgeDocument(documentId);
    }
  }

  async getChatStatus(): Promise<ChatStatusResponse> {
    if (USE_MOCK) return mockApi.getChatStatus();
    try {
      return await this.fetchJson<ChatStatusResponse>("/chat/status");
    } catch {
      return mockApi.getChatStatus();
    }
  }

  // --- Campaign Adaptation ---
  async adaptCampaign(contentId: string, platforms: string[]): Promise<CampaignAdaptation[]> {
    if (USE_MOCK) return mockApi.adaptCampaign(contentId, platforms);
    try {
      return await this.fetchJson<CampaignAdaptation[]>(`/campaigns/${contentId}/adapt`, {
        method: "POST",
        body: JSON.stringify({ platforms }),
      });
    } catch {
      return mockApi.adaptCampaign(contentId, platforms);
    }
  }

  async getCampaignAdaptations(contentId: string): Promise<CampaignAdaptation[]> {
    if (USE_MOCK) return mockApi.getCampaignAdaptations(contentId);
    try {
      return await this.fetchJson<CampaignAdaptation[]>(`/campaigns/${contentId}/adaptations`);
    } catch {
      return mockApi.getCampaignAdaptations(contentId);
    }
  }

  async editAdaptation(adaptationId: string, content: Record<string, any>): Promise<CampaignAdaptation> {
    if (USE_MOCK) return mockApi.editAdaptation(adaptationId, content);
    try {
      return await this.fetchJson<CampaignAdaptation>(`/adaptations/${adaptationId}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      });
    } catch {
      return mockApi.editAdaptation(adaptationId, content);
    }
  }

  async regenerateAdaptation(adaptationId: string): Promise<CampaignAdaptation> {
    if (USE_MOCK) return mockApi.regenerateAdaptation(adaptationId);
    try {
      return await this.fetchJson<CampaignAdaptation>(`/adaptations/${adaptationId}/regenerate`, {
        method: "POST",
      });
    } catch {
      return mockApi.regenerateAdaptation(adaptationId);
    }
  }

  async submitAdaptationForReview(adaptationId: string): Promise<{ message: string; submission_id: string; adaptation_id: string; status: string }> {
    if (USE_MOCK) return mockApi.submitAdaptationForReview(adaptationId);
    try {
      return await this.fetchJson<{ message: string; submission_id: string; adaptation_id: string; status: string }>(`/adaptations/${adaptationId}/submit-for-review`, {
        method: "POST",
      });
    } catch {
      return mockApi.submitAdaptationForReview(adaptationId);
    }
  }
}

export const api = new ApiService();
export type { IApiService, CreateSubmissionInput, ReviewDecisionInput };

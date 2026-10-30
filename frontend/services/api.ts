/**
 * Unified API Client for Inkloom AI Brand Governance
 * Implements IApiService with dynamic JWT authentication & tenant scoping.
 * Automatically falls back to MockApiService if NEXT_PUBLIC_USE_MOCK=true or backend is unavailable.
 */
import type {
  IApiService,
  CreateSubmissionInput,
  ReviewDecisionInput,
} from "./mock-api";

// Lazy-loaded Mock API proxy: Prevents bundling 3,750+ lines of mock fixtures in production client bundles
let _mockApiPromise: Promise<any> | null = null;
let _mockApiInstance: any = null;

async function getMockApiInstance(): Promise<any> {
  if (_mockApiInstance) return _mockApiInstance;
  if (!_mockApiPromise) {
    _mockApiPromise = import("./mock-api").then((mod) => {
      _mockApiInstance = mod.mockApi;
      return _mockApiInstance;
    });
  }
  return _mockApiPromise;
}

const mockApi: any = new Proxy({}, {
  get(_target, prop: string) {
    if (prop === "then") return undefined;
    return async (...args: any[]) => {
      const realMock = await getMockApiInstance();
      const fn = realMock[prop];
      if (typeof fn === "function") {
        return fn.apply(realMock, args);
      }
      return fn;
    };
  },
});
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
  CampaignBriefRequest,
  MarketingGenerationResponse,
  SaveDraftRequest,
  UpdateDraftRevisionRequest,
  DraftDetailResponse,
  BrandAssetItem,
  CreativeBriefRequest,
  DesignConceptGenerationResponse,
  SaveCreativeBriefDraftRequest,
  DesignDraftDetailResponse,
  AuthoritativeLegalSource,
  LegalReviewRequest,
  LegalReviewReport,
  ApplyRevisionRequest,
  RecordLegalFeedbackRequest,
  Campaign,
  CampaignCreate,
  CampaignUpdate,
  CampaignDecisionRequest,
  CampaignReadinessEvaluation,
  NotificationItem,
  ReferenceImageAnalysisRequest,
  ReferenceImageAnalysisResponse,
  DesignCritiqueRequest,
  DesignCritiqueResponse,
  DesignAdaptationRequest,
  DesignAdaptationResponse,
  CopilotOrchestrateRequest,
  CopilotOrchestrateResponse,
  CopilotFeedbackRequest,
<<<<<<< HEAD
  ReviewCycleRecord,
  DepartmentReviewRecord,
  DesignerFeedbackSummaryData,
  SubmitDepartmentReviewInput,
=======
  MediaItem,
  MediaItemListResponse,
  UploadMediaInput,
>>>>>>> 83a65e189b2c5eb7f9f2b7c2702f006bbaa49626
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

  async getAllComments(): Promise<ContentComment[]> {
    if (USE_MOCK) return mockApi.getAllComments();
    try {
      const res = await this.fetchJson<CommentsListResponse>("/comments");
      if (res && Array.isArray(res.comments)) {
        return res.comments;
      }
      return mockApi.getAllComments();
    } catch {
      // Graceful fallback: load submissions and their comments
      try {
        const subs = await this.getSubmissions();
        const results = await Promise.all(
          subs.map((s) => this.getSubmissionComments(s.id).catch(() => ({ comments: [] })))
        );
        const combined = results.flatMap((r) => r.comments || []);
        if (combined.length > 0) {
          return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        return mockApi.getAllComments();
      } catch {
        return mockApi.getAllComments();
      }
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

  // ==========================================
  // Marketing Copilot API Endpoints
  // ==========================================
  async generateMarketingCopy(brief: CampaignBriefRequest): Promise<MarketingGenerationResponse> {
    if (USE_MOCK) return mockApi.generateMarketingCopy(brief);
    try {
      return await this.fetchJson<MarketingGenerationResponse>("/marketing-copilot/generate", {
        method: "POST",
        body: JSON.stringify(brief),
      }, 30000); // 30s timeout for LLM generation
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.generateMarketingCopy(brief);
    }
  }

  async saveMarketingDraft(payload: SaveDraftRequest): Promise<DraftDetailResponse> {
    if (USE_MOCK) return mockApi.saveMarketingDraft(payload);
    try {
      return await this.fetchJson<DraftDetailResponse>("/marketing-copilot/drafts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.saveMarketingDraft(payload);
    }
  }

  async getMarketingDrafts(limit: number = 50, offset: number = 0): Promise<DraftDetailResponse[]> {
    if (USE_MOCK) return mockApi.getMarketingDrafts(limit, offset);
    try {
      return await this.fetchJson<DraftDetailResponse[]>(`/marketing-copilot/drafts?limit=${limit}&offset=${offset}`);
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getMarketingDrafts(limit, offset);
    }
  }

  async getMarketingDraft(draftId: string): Promise<DraftDetailResponse> {
    if (USE_MOCK) return mockApi.getMarketingDraft(draftId);
    try {
      return await this.fetchJson<DraftDetailResponse>(`/marketing-copilot/drafts/${draftId}`);
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getMarketingDraft(draftId);
    }
  }

  async updateMarketingDraftRevision(
    draftId: string,
    payload: UpdateDraftRevisionRequest
  ): Promise<DraftDetailResponse> {
    if (USE_MOCK) return mockApi.updateMarketingDraftRevision(draftId, payload);
    try {
      return await this.fetchJson<DraftDetailResponse>(`/marketing-copilot/drafts/${draftId}/revisions`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.updateMarketingDraftRevision(draftId, payload);
    }
  }

  async auditMarketingDraft(draftId: string, revisionId?: string): Promise<AuditResult> {
    if (USE_MOCK) return mockApi.auditMarketingDraft(draftId, revisionId);
    try {
      const url = revisionId
        ? `/marketing-copilot/drafts/${draftId}/audit?revision_id=${revisionId}`
        : `/marketing-copilot/drafts/${draftId}/audit`;
      return await this.fetchJson<AuditResult>(url, {
        method: "POST",
      }, 45000); // 45s timeout for deep multi-layer audit
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.auditMarketingDraft(draftId, revisionId);
    }
  }

  async submitMarketingDraft(draftId: string): Promise<DraftDetailResponse> {
    if (USE_MOCK) return mockApi.submitMarketingDraft(draftId);
    try {
      return await this.fetchJson<DraftDetailResponse>(`/marketing-copilot/drafts/${draftId}/submit`, {
        method: "POST",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.submitMarketingDraft(draftId);
    }
  }

  // ==========================================
  // Designer Copilot
  // ==========================================
  async getAuthorizedBrandAssets(assetType?: string): Promise<BrandAssetItem[]> {
    if (USE_MOCK) return mockApi.getAuthorizedBrandAssets(assetType);
    try {
      const url = assetType
        ? `/designer-copilot/assets?asset_type=${encodeURIComponent(assetType)}`
        : "/designer-copilot/assets";
      return await this.fetchJson<BrandAssetItem[]>(url);
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getAuthorizedBrandAssets(assetType);
    }
  }

  async generateDesignConcepts(brief: CreativeBriefRequest): Promise<DesignConceptGenerationResponse> {
    if (USE_MOCK) return mockApi.generateDesignConcepts(brief);
    try {
      return await this.fetchJson<DesignConceptGenerationResponse>("/designer-copilot/concepts/generate", {
        method: "POST",
        body: JSON.stringify(brief),
      }, 35000); // 35s timeout for AI concept generation
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.generateDesignConcepts(brief);
    }
  }

  async saveDesignBriefDraft(payload: SaveCreativeBriefDraftRequest): Promise<DesignDraftDetailResponse> {
    if (USE_MOCK) return mockApi.saveDesignBriefDraft(payload);
    try {
      return await this.fetchJson<DesignDraftDetailResponse>("/designer-copilot/briefs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.saveDesignBriefDraft(payload);
    }
  }

  async getDesignBriefs(limit: number = 50, offset: number = 0): Promise<DesignDraftDetailResponse[]> {
    if (USE_MOCK) return mockApi.getDesignBriefs(limit, offset);
    try {
      return await this.fetchJson<DesignDraftDetailResponse[]>(
        `/designer-copilot/briefs?limit=${limit}&offset=${offset}`
      );
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getDesignBriefs(limit, offset);
    }
  }

  async getDesignBrief(briefId: string): Promise<DesignDraftDetailResponse> {
    if (USE_MOCK) return mockApi.getDesignBrief(briefId);
    try {
      return await this.fetchJson<DesignDraftDetailResponse>(`/designer-copilot/briefs/${briefId}`);
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getDesignBrief(briefId);
    }
  }

  async uploadDesignVersion(
    briefId: string,
    file: File,
    changeSummary?: string
  ): Promise<DesignDraftDetailResponse> {
    if (USE_MOCK) return mockApi.uploadDesignVersion(briefId, file, changeSummary);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (changeSummary) {
        formData.append("change_summary", changeSummary);
      }

      const url = `${API_BASE}/designer-copilot/briefs/${briefId}/upload`;
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
        throw new ApiError(errorData.detail || "Failed to upload design version", res.status, false, errorData.detail);
      }
      return await res.json();
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.uploadDesignVersion(briefId, file, changeSummary);
    }
  }

  async auditDesignVersion(briefId: string, revisionId?: string): Promise<AuditResult> {
    if (USE_MOCK) return mockApi.auditDesignVersion(briefId, revisionId);
    try {
      const url = revisionId
        ? `/designer-copilot/briefs/${briefId}/audit?revision_id=${revisionId}`
        : `/designer-copilot/briefs/${briefId}/audit`;
      return await this.fetchJson<AuditResult>(url, {
        method: "POST",
      }, 45000);
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.auditDesignVersion(briefId, revisionId);
    }
  }

  async submitDesignForReview(briefId: string): Promise<DesignDraftDetailResponse> {
    if (USE_MOCK) return mockApi.submitDesignForReview(briefId);
    try {
      return await this.fetchJson<DesignDraftDetailResponse>(`/designer-copilot/briefs/${briefId}/submit`, {
        method: "POST",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.submitDesignForReview(briefId);
    }
  }

  async analyzeReferenceImage(req: ReferenceImageAnalysisRequest): Promise<ReferenceImageAnalysisResponse> {
    return await this.fetchJson<ReferenceImageAnalysisResponse>("/designer-copilot/analyze-image", {
      method: "POST",
      body: JSON.stringify(req),
    }, 25000);
  }

  async critiqueDesign(req: DesignCritiqueRequest): Promise<DesignCritiqueResponse> {
    return await this.fetchJson<DesignCritiqueResponse>("/designer-copilot/critique", {
      method: "POST",
      body: JSON.stringify(req),
    }, 25000);
  }

  async adaptDesignConcept(req: DesignAdaptationRequest): Promise<DesignAdaptationResponse> {
    return await this.fetchJson<DesignAdaptationResponse>("/designer-copilot/adapt", {
      method: "POST",
      body: JSON.stringify(req),
    }, 25000);
  }

  async orchestrateCopilot(req: CopilotOrchestrateRequest): Promise<CopilotOrchestrateResponse> {
    return await this.fetchJson<CopilotOrchestrateResponse>("/chat/orchestrate", {
      method: "POST",
      body: JSON.stringify(req),
    }, 35000);
  }

  async sendCopilotFeedback(req: CopilotFeedbackRequest): Promise<any> {
    return await this.fetchJson<any>("/chat/feedback", {
      method: "POST",
      body: JSON.stringify(req),
    });
  }

  // Phase 5: Legal Copilot
  async getLegalSources(jurisdiction?: string, regulatedCategory?: string): Promise<AuthoritativeLegalSource[]> {
    if (USE_MOCK) return mockApi.getLegalSources(jurisdiction, regulatedCategory);
    try {
      const params = new URLSearchParams();
      if (jurisdiction) params.append("jurisdiction", jurisdiction);
      if (regulatedCategory) params.append("regulated_category", regulatedCategory);
      const query = params.toString() ? `?${params.toString()}` : "";
      return await this.fetchJson<AuthoritativeLegalSource[]>(`/legal-copilot/sources${query}`);
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getLegalSources(jurisdiction, regulatedCategory);
    }
  }

  async reviewLegalCompliance(request: LegalReviewRequest): Promise<LegalReviewReport> {
    if (USE_MOCK) return mockApi.reviewLegalCompliance(request);
    try {
      return await this.fetchJson<LegalReviewReport>(`/legal-copilot/review`, {
        method: "POST",
        body: JSON.stringify(request),
      }, 45000);
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.reviewLegalCompliance(request);
    }
  }

  async getSubmissionLegalReport(submissionId: string, jurisdiction?: string): Promise<LegalReviewReport> {
    if (USE_MOCK) return mockApi.getSubmissionLegalReport(submissionId, jurisdiction);
    try {
      const query = jurisdiction ? `?jurisdiction=${encodeURIComponent(jurisdiction)}` : "";
      return await this.fetchJson<LegalReviewReport>(`/legal-copilot/reviews/${submissionId}${query}`, {
        method: "GET",
      }, 30000);
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getSubmissionLegalReport(submissionId, jurisdiction);
    }
  }

  async applyLegalRevision(submissionId: string, payload: ApplyRevisionRequest): Promise<any> {
    if (USE_MOCK) return mockApi.applyLegalRevision(submissionId, payload);
    try {
      return await this.fetchJson<any>(`/legal-copilot/reviews/${submissionId}/apply-revision`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.applyLegalRevision(submissionId, payload);
    }
  }

  async recordLegalDecision(submissionId: string, payload: RecordLegalFeedbackRequest): Promise<any> {
    if (USE_MOCK) return mockApi.recordLegalDecision(submissionId, payload);
    try {
      return await this.fetchJson<any>(`/legal-copilot/reviews/${submissionId}/decision`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.recordLegalDecision(submissionId, payload);
    }
  }

  // -------------------------------------------------------------------------
  // Phase 6: Unified Campaign Workflow & Orchestration API Methods
  // -------------------------------------------------------------------------

  async getCampaigns(status?: string, priority?: string): Promise<Campaign[]> {
    if (USE_MOCK) return mockApi.getCampaigns(status, priority);
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (priority) params.append("priority", priority);
      const query = params.toString() ? `?${params.toString()}` : "";
      return await this.fetchJson<Campaign[]>(`/campaigns${query}`, { method: "GET" });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getCampaigns(status, priority);
    }
  }

  async getCampaign(campaignId: string): Promise<Campaign> {
    if (USE_MOCK) return mockApi.getCampaign(campaignId);
    try {
      return await this.fetchJson<Campaign>(`/campaigns/${campaignId}`, { method: "GET" });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getCampaign(campaignId);
    }
  }

  async createCampaign(payload: CampaignCreate): Promise<Campaign> {
    if (USE_MOCK) return mockApi.createCampaign(payload);
    try {
      return await this.fetchJson<Campaign>("/campaigns", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.createCampaign(payload);
    }
  }

  async updateCampaign(campaignId: string, payload: CampaignUpdate): Promise<Campaign> {
    if (USE_MOCK) return mockApi.updateCampaign(campaignId, payload);
    try {
      return await this.fetchJson<Campaign>(`/campaigns/${campaignId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.updateCampaign(campaignId, payload);
    }
  }

  async associateSubmissionsToCampaign(campaignId: string, submissionIds: string[]): Promise<Campaign> {
    if (USE_MOCK) return mockApi.associateSubmissionsToCampaign(campaignId, submissionIds);
    try {
      return await this.fetchJson<Campaign>(`/campaigns/${campaignId}/associate`, {
        method: "POST",
        body: JSON.stringify({ submission_ids: submissionIds }),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.associateSubmissionsToCampaign(campaignId, submissionIds);
    }
  }

  async runCampaignReviews(campaignId: string): Promise<Campaign> {
    if (USE_MOCK) return mockApi.runCampaignReviews(campaignId);
    try {
      return await this.fetchJson<Campaign>(`/campaigns/${campaignId}/reviews/run`, {
        method: "POST",
      }, 60000);
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.runCampaignReviews(campaignId);
    }
  }

  async submitCampaignDecision(campaignId: string, payload: CampaignDecisionRequest): Promise<Campaign> {
    if (USE_MOCK) return mockApi.submitCampaignDecision(campaignId, payload);
    try {
      return await this.fetchJson<Campaign>(`/campaigns/${campaignId}/decide`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.submitCampaignDecision(campaignId, payload);
    }
  }

  async getCampaignReadiness(campaignId: string): Promise<CampaignReadinessEvaluation> {
    if (USE_MOCK) return mockApi.getCampaignReadiness(campaignId);
    try {
      return await this.fetchJson<CampaignReadinessEvaluation>(`/campaigns/${campaignId}/readiness`, {
        method: "GET",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getCampaignReadiness(campaignId);
    }
  }

  async getCampaignActivity(campaignId: string): Promise<any[]> {
    if (USE_MOCK) return mockApi.getCampaignActivity(campaignId);
    try {
      return await this.fetchJson<any[]>(`/campaigns/${campaignId}/activity`, {
        method: "GET",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getCampaignActivity(campaignId);
    }
  }

  async getNotifications(unreadOnly?: boolean): Promise<NotificationItem[]> {
    if (USE_MOCK) return mockApi.getNotifications(unreadOnly);
    try {
      const query = unreadOnly ? "?unread_only=true" : "";
      return await this.fetchJson<NotificationItem[]>(`/notifications${query}`, {
        method: "GET",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getNotifications(unreadOnly);
    }
  }

  async markNotificationRead(notificationId: string): Promise<any> {
    if (USE_MOCK) return mockApi.markNotificationRead(notificationId);
    try {
      return await this.fetchJson<any>(`/notifications/${notificationId}/read`, {
        method: "POST",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.markNotificationRead(notificationId);
    }
  }

  async markAllNotificationsRead(): Promise<any> {
    if (USE_MOCK) return mockApi.markAllNotificationsRead();
    try {
      return await this.fetchJson<any>("/notifications/read-all", {
        method: "POST",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.markAllNotificationsRead();
    }
  }

<<<<<<< HEAD
  // Phase 4 & 7: Centralized Review Cycles & Department Reviews
  async getReviewCycles(submissionId?: string): Promise<ReviewCycleRecord[]> {
    if (USE_MOCK) return mockApi.getReviewCycles(submissionId);
    try {
      const query = submissionId ? `?submission_id=${encodeURIComponent(submissionId)}` : "";
      return await this.fetchJson<ReviewCycleRecord[]>(`/review-cycles${query}`, {
        method: "GET",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getReviewCycles(submissionId);
    }
  }

  async getReviewCycle(cycleId: string): Promise<ReviewCycleRecord> {
    if (USE_MOCK) return mockApi.getReviewCycle(cycleId);
    try {
      return await this.fetchJson<ReviewCycleRecord>(`/review-cycles/${cycleId}`, {
        method: "GET",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getReviewCycle(cycleId);
    }
  }

  async submitDepartmentReview(cycleId: string, data: SubmitDepartmentReviewInput): Promise<DepartmentReviewRecord> {
    if (USE_MOCK) return mockApi.submitDepartmentReview(cycleId, data);
    try {
      return await this.fetchJson<DepartmentReviewRecord>(`/review-cycles/${cycleId}/department-review`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.submitDepartmentReview(cycleId, data);
    }
  }

  async grantFinalApproval(cycleId: string, rationale?: string): Promise<ReviewCycleRecord> {
    if (USE_MOCK) return mockApi.grantFinalApproval(cycleId, rationale);
    try {
      return await this.fetchJson<ReviewCycleRecord>(`/review-cycles/${cycleId}/final-approval`, {
        method: "POST",
        body: JSON.stringify({ rationale }),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.grantFinalApproval(cycleId, rationale);
    }
  }

  async getDesignerFeedbackSummary(): Promise<DesignerFeedbackSummaryData> {
    if (USE_MOCK) return mockApi.getDesignerFeedbackSummary();
    try {
      return await this.fetchJson<DesignerFeedbackSummaryData>("/feedback/designer-summary", {
        method: "GET",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      return mockApi.getDesignerFeedbackSummary();
    }
=======
  // =========================================================
  // Persistent Real-Time Media Storage & Administration
  // =========================================================
  async uploadMedia(
    file: File,
    options?: { description?: string; campaign_id?: string; title?: string }
  ): Promise<MediaItem> {
    if (USE_MOCK) return mockApi.uploadMedia(file, options);

    const formData = new FormData();
    formData.append("file", file);
    if (options?.description) formData.append("description", options.description);
    if (options?.campaign_id) formData.append("campaign_id", options.campaign_id);
    if (options?.title) formData.append("title", options.title);

    const url = `${API_BASE}/media/upload`;
    const headers: Record<string, string> = {
      "X-Tenant-Id": activeTenantId,
    };
    if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      let errDetail = res.statusText;
      try {
        const errBody = await res.json();
        errDetail = errBody.detail || errBody.message || res.statusText;
      } catch {}
      throw new ApiError(errDetail || "Media upload failed", res.status, false, errDetail);
    }

    const savedMedia: MediaItem = await res.json();

    // Broadcast cross-tab and cross-component dynamic sync event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("inkloom_media_uploaded", { detail: savedMedia }));
      window.dispatchEvent(new CustomEvent("inkloom_asset_updated", { detail: savedMedia }));
      try {
        localStorage.setItem("inkloom_last_media_upload", JSON.stringify({ id: savedMedia.id, ts: Date.now() }));
      } catch {}
    }

    return savedMedia;
  }

  async getAdminMedia(filters?: {
    status?: string;
    uploaded_by?: string;
    file_type?: string;
    campaign_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<MediaItemListResponse> {
    if (USE_MOCK) return mockApi.getAdminMedia(filters);
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.uploaded_by) params.append("uploaded_by", filters.uploaded_by);
    if (filters?.file_type) params.append("file_type", filters.file_type);
    if (filters?.campaign_id) params.append("campaign_id", filters.campaign_id);
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.offset) params.append("offset", String(filters.offset));

    const qs = params.toString() ? `?${params.toString()}` : "";
    return await this.fetchJson<MediaItemListResponse>(`/admin/media${qs}`);
  }

  async getMedia(filters?: {
    status?: string;
    file_type?: string;
    campaign_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<MediaItemListResponse> {
    if (USE_MOCK) return mockApi.getMedia(filters);
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.file_type) params.append("file_type", filters.file_type);
    if (filters?.campaign_id) params.append("campaign_id", filters.campaign_id);
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.offset) params.append("offset", String(filters.offset));

    const qs = params.toString() ? `?${params.toString()}` : "";
    return await this.fetchJson<MediaItemListResponse>(`/media${qs}`);
  }

  async getMediaItem(mediaId: string): Promise<MediaItem> {
    if (USE_MOCK) return mockApi.getMediaItem(mediaId);
    return await this.fetchJson<MediaItem>(`/media/${mediaId}`);
>>>>>>> 83a65e189b2c5eb7f9f2b7c2702f006bbaa49626
  }
}

export const api = new ApiService();
export { mockApi };
export type { IApiService, CreateSubmissionInput, ReviewDecisionInput };


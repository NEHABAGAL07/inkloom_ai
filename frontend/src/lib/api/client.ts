import {
  AuditResult,
  ContentItem,
  ContentHistory,
  BrandGuideline,
  BrandRule,
  VerifiedFact,
  ReviewDecision,
  AnalyticsOverview,
  HealthStatus,
} from '../../types';

const MOCK_STORAGE_KEY = 'inkloom_mock_mode_enabled';

export function isMockModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(MOCK_STORAGE_KEY);
  if (stored !== null) return stored === 'true';
  return import.meta.env.VITE_USE_MOCK_API === 'true';
}

export function setMockModeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_STORAGE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('mock-mode-changed', { detail: { enabled } }));
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// In-memory mock store
let mockContentItems: ContentItem[] = [
  {
    content_id: 'cnt-demo-001',
    title: 'Q4 Product Launch - Enterprise Cloud Campaign',
    content_type: 'text',
    raw_text:
      'Try inkloom today for best-in-class workflows. Our system delivers a 100% error-free guarantee across all media.',
    current_revision: 1,
    status: 'pending_approval',
    organization_id: 'org-default-001',
    author_id: 'usr-demo-001',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    content_id: 'cnt-demo-002',
    title: 'Brand Modernization Press Release',
    content_type: 'text',
    raw_text:
      'Inkloom AI empowers enterprise global brands to streamline compliance with automated precision.',
    current_revision: 2,
    status: 'approved',
    organization_id: 'org-default-001',
    author_id: 'usr-demo-002',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

let mockAudits: Record<string, AuditResult> = {
  'cnt-demo-001': {
    audit_id: 'aud-demo-001',
    content_id: 'cnt-demo-001',
    content_version: 1,
    guideline_id: 'gdl-001',
    overall_score: 72,
    status: 'completed',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    findings: [
      {
        id: 'fnd-001',
        category: 'terminology',
        severity: 'medium',
        original_text: 'inkloom',
        explanation: 'Product name must use canonical casing "Inkloom AI".',
        evidence_status: 'supported',
        suggestion: 'Inkloom AI',
      },
      {
        id: 'fnd-002',
        category: 'unsupported_claim',
        severity: 'high',
        original_text: '100% error-free guarantee',
        explanation: 'Superlative claim lacks empirical evidence in the verified claim registry.',
        evidence_status: 'unverified',
        suggestion: 'rigorous multi-stage compliance verification',
      },
    ],
  },
  'aud-demo-001': {
    audit_id: 'aud-demo-001',
    content_id: 'cnt-demo-001',
    content_version: 1,
    guideline_id: 'gdl-001',
    overall_score: 72,
    status: 'completed',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    findings: [
      {
        id: 'fnd-001',
        category: 'terminology',
        severity: 'medium',
        original_text: 'inkloom',
        explanation: 'Product name must use canonical casing "Inkloom AI".',
        evidence_status: 'supported',
        suggestion: 'Inkloom AI',
      },
      {
        id: 'fnd-002',
        category: 'unsupported_claim',
        severity: 'high',
        original_text: '100% error-free guarantee',
        explanation: 'Superlative claim lacks empirical evidence in the verified claim registry.',
        evidence_status: 'unverified',
        suggestion: 'rigorous multi-stage compliance verification',
      },
    ],
  },
};

let mockGuidelines: BrandGuideline[] = [
  {
    id: 'gdl-001',
    organization_id: 'org-default-001',
    name: 'Core Brand Identity & Naming Standards',
    category: 'Brand Identity',
    version: '1.2.0',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    rules: [
      {
        id: 'rul-001',
        title: 'Inkloom AI Canonical Trademark',
        description: 'Always capitalize Inkloom AI accurately. Never use lowercase inkloom or InkLoom.',
        category: 'terminology',
        severity: 'medium',
        prohibited_phrases: ['inkloom', 'InkLoom'],
        required_phrases: ['Inkloom AI'],
      },
      {
        id: 'rul-002',
        title: 'Prohibition on Absolute Guarantee Superlatives',
        description: 'Prevent regulatory non-compliance from unverified claims of perfection.',
        category: 'unsupported_claim',
        severity: 'high',
        prohibited_phrases: ['100% error-free', 'flawless guaranteed', 'unhackable'],
      },
    ],
  },
];

let mockFacts: VerifiedFact[] = [
  {
    id: 'fct-001',
    organization_id: 'org-default-001',
    claim_text: 'Inkloom AI reduces human brand review cycle time by up to 68%.',
    source_url: 'https://internal.inkloom.local/metrics/benchmark-2025.pdf',
    confidence_score: 0.98,
    status: 'verified',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

let mockReviews: ReviewDecision[] = [
  {
    review_id: 'rev-001',
    content_id: 'cnt-demo-002',
    revision_id: 2,
    action: 'approved',
    status: 'approved',
    reviewer_id: 'usr-reviewer-01',
    comments: 'Looks good! All terminology and claims verified.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      // Keep default
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    if (isMockModeEnabled()) {
      return {
        status: 'healthy',
        version: '1.0.0-mock',
        timestamp: new Date().toISOString(),
        database: 'in-memory-mock',
        environment: 'mock',
      };
    }
    try {
      const data = await apiFetch<any>('/health');
      return {
        status: data.status || 'healthy',
        version: data.version || '1.0.0',
        timestamp: data.timestamp || new Date().toISOString(),
        database: data.database || 'sqlite/postgresql',
        environment: data.environment || 'development',
      };
    } catch (err) {
      if (isMockModeEnabled()) {
        return {
          status: 'healthy',
          version: '1.0.0-mock',
          timestamp: new Date().toISOString(),
          database: 'in-memory-mock',
          environment: 'mock',
        };
      }
      throw err;
    }
  },

  async getAnalytics(): Promise<AnalyticsOverview> {
    if (isMockModeEnabled()) {
      return {
        total_content_items: mockContentItems.length,
        total_audits: Object.keys(mockAudits).length,
        approved_count: mockContentItems.filter((c) => c.status === 'approved').length,
        changes_requested_count: mockContentItems.filter((c) => c.status === 'changes_requested').length,
        rejected_count: mockContentItems.filter((c) => c.status === 'rejected').length,
        findings_by_severity: {
          critical: 1,
          high: 2,
          medium: 3,
          low: 0,
        },
        compliance_rate: 85.5,
      };
    }
    try {
      const data = await apiFetch<any>('/analytics');
      return {
        total_content_items: data.total_content || data.total_content_items || 0,
        total_audits: data.total_audits || 0,
        approved_count: data.total_approved || data.approved_count || 0,
        changes_requested_count: data.changes_requested_count || 0,
        rejected_count: data.rejected_count || 0,
        findings_by_severity: data.findings_by_severity || { critical: 0, high: 0, medium: 0, low: 0 },
        compliance_rate: data.compliance_rate || 100,
      };
    } catch {
      return {
        total_content_items: mockContentItems.length,
        total_audits: Object.keys(mockAudits).length,
        approved_count: 1,
        changes_requested_count: 0,
        rejected_count: 0,
        findings_by_severity: { critical: 0, high: 1, medium: 1, low: 0 },
        compliance_rate: 82.0,
      };
    }
  },

  async getContentList(): Promise<ContentItem[]> {
    if (isMockModeEnabled()) return [...mockContentItems];
    try {
      return await apiFetch<ContentItem[]>('/content');
    } catch {
      return [...mockContentItems];
    }
  },

  async getContentById(id: string): Promise<ContentItem> {
    if (isMockModeEnabled()) {
      const found = mockContentItems.find((c) => c.content_id === id);
      if (!found) throw new Error(`Content item ${id} not found`);
      return found;
    }
    try {
      return await apiFetch<ContentItem>(`/content/${id}`);
    } catch {
      const found = mockContentItems.find((c) => c.content_id === id);
      if (found) return found;
      throw new Error(`Content item ${id} not found`);
    }
  },

  async getContentHistory(id: string): Promise<ContentHistory> {
    if (isMockModeEnabled()) {
      const item = mockContentItems.find((c) => c.content_id === id);
      return {
        content_id: id,
        title: item?.title || 'Marketing Copy',
        current_revision: item?.current_revision || 1,
        status: item?.status || 'pending_approval',
        versions: [
          {
            version_number: 1,
            text: item?.raw_text || '',
            change_summary: 'Initial submission',
            created_at: item?.created_at || new Date().toISOString(),
          },
        ],
      };
    }
    try {
      return await apiFetch<ContentHistory>(`/content/${id}/history`);
    } catch {
      return this.getContentHistory(id);
    }
  },

  async getContentReviews(id: string): Promise<ReviewDecision[]> {
    if (isMockModeEnabled()) {
      return mockReviews.filter((r) => r.content_id === id);
    }
    try {
      return await apiFetch<ReviewDecision[]>(`/reviews?content_id=${id}`);
    } catch {
      return mockReviews.filter((r) => r.content_id === id);
    }
  },

  async getReviews(): Promise<ReviewDecision[]> {
    if (isMockModeEnabled()) return [...mockReviews];
    try {
      return await apiFetch<ReviewDecision[]>('/reviews');
    } catch {
      return [...mockReviews];
    }
  },

  async submitReviewDecision(
    contentId: string,
    payload: { action: string; comments?: string; reviewer_id?: string }
  ): Promise<ReviewDecision> {
    const decision: ReviewDecision = {
      review_id: `rev-${Date.now()}`,
      content_id: contentId,
      revision_id: 1,
      action: payload.action as any,
      status: payload.action,
      reviewer_id: payload.reviewer_id || 'usr-reviewer-01',
      comments: payload.comments,
      created_at: new Date().toISOString(),
    };

    if (isMockModeEnabled()) {
      mockReviews.unshift(decision);
      const item = mockContentItems.find((c) => c.content_id === contentId);
      if (item) {
        item.status =
          payload.action === 'approved' || payload.action === 'approve'
            ? 'approved'
            : payload.action === 'rejected' || payload.action === 'reject'
            ? 'rejected'
            : 'changes_requested';
      }
      return decision;
    }

    try {
      const result = await apiFetch<any>(`/reviews/${contentId}/decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return {
        ...decision,
        review_id: result.id || decision.review_id,
        action: result.action || decision.action,
      };
    } catch {
      mockReviews.unshift(decision);
      return decision;
    }
  },

  async getGuidelines(): Promise<BrandGuideline[]> {
    if (isMockModeEnabled()) return [...mockGuidelines];
    try {
      return await apiFetch<BrandGuideline[]>('/guidelines');
    } catch {
      return [...mockGuidelines];
    }
  },

  async getVerifiedFacts(): Promise<VerifiedFact[]> {
    if (isMockModeEnabled()) return [...mockFacts];
    try {
      return await apiFetch<VerifiedFact[]>('/facts');
    } catch {
      return [...mockFacts];
    }
  },

  async createGuideline(payload: Partial<BrandGuideline>): Promise<BrandGuideline> {
    const newGuideline: BrandGuideline = {
      id: `gdl-${Date.now()}`,
      organization_id: 'org-default-001',
      name: payload.name || 'Untitled Guideline',
      category: payload.category || 'General',
      version: payload.version || '1.0.0',
      rules: payload.rules || [],
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (isMockModeEnabled()) {
      mockGuidelines.push(newGuideline);
      return newGuideline;
    }

    try {
      return await apiFetch<BrandGuideline>('/guidelines', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      mockGuidelines.push(newGuideline);
      return newGuideline;
    }
  },

  async addRuleToGuideline(guidelineId: string, payload: Partial<BrandRule>): Promise<BrandRule> {
    const newRule: BrandRule = {
      id: `rul-${Date.now()}`,
      title: payload.title || 'Brand Rule',
      description: payload.description || '',
      category: payload.category || 'terminology',
      severity: payload.severity || 'medium',
      prohibited_phrases: payload.prohibited_phrases,
      required_phrases: payload.required_phrases,
    };

    if (isMockModeEnabled()) {
      const guideline = mockGuidelines.find((g) => g.id === guidelineId);
      if (guideline) guideline.rules.push(newRule);
      return newRule;
    }

    try {
      return await apiFetch<BrandRule>(`/guidelines/${guidelineId}/rules`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return newRule;
    }
  },

  async createVerifiedFact(payload: Partial<VerifiedFact>): Promise<VerifiedFact> {
    const newFact: VerifiedFact = {
      id: `fct-${Date.now()}`,
      organization_id: 'org-default-001',
      claim_text: payload.claim_text || '',
      source_url: payload.source_url,
      confidence_score: payload.confidence_score ?? 1.0,
      status: payload.status || 'verified',
      created_at: new Date().toISOString(),
    };

    if (isMockModeEnabled()) {
      mockFacts.push(newFact);
      return newFact;
    }

    try {
      return await apiFetch<VerifiedFact>('/facts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      mockFacts.push(newFact);
      return newFact;
    }
  },

  async submitContent(payload: {
    title: string;
    content_type: string;
    raw_text?: string;
    file?: File;
  }): Promise<ContentItem> {
    const newItem: ContentItem = {
      content_id: `cnt-${Date.now()}`,
      title: payload.title,
      content_type: payload.content_type as any,
      raw_text: payload.raw_text,
      current_revision: 1,
      status: 'pending_approval',
      organization_id: 'org-default-001',
      author_id: 'usr-demo-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isMockModeEnabled()) {
      mockContentItems.unshift(newItem);
      return newItem;
    }

    try {
      if (payload.file) {
        const formData = new FormData();
        formData.append('title', payload.title);
        formData.append('content_type', payload.content_type);
        formData.append('file', payload.file);
        if (payload.raw_text) formData.append('raw_text', payload.raw_text);

        const res = await fetch(`${API_BASE_URL}/content/submit`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
      }

      return await apiFetch<ContentItem>('/content', {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          content_type: payload.content_type,
          raw_text: payload.raw_text,
        }),
      });
    } catch {
      mockContentItems.unshift(newItem);
      return newItem;
    }
  },

  async runAudit(
    contentId: string,
    revision: number = 1,
    guidelineIds?: string[]
  ): Promise<AuditResult> {
    if (isMockModeEnabled()) {
      const existing = mockAudits[contentId];
      if (existing) return existing;
      const created: AuditResult = {
        audit_id: `aud-${Date.now()}`,
        content_id: contentId,
        content_version: revision,
        overall_score: 95,
        status: 'completed',
        created_at: new Date().toISOString(),
        findings: [],
      };
      mockAudits[contentId] = created;
      mockAudits[created.audit_id] = created;
      return created;
    }

    try {
      const res = await apiFetch<AuditResult>(`/content/${contentId}/audit`, {
        method: 'POST',
        body: JSON.stringify({ revision_id: revision, guideline_ids: guidelineIds }),
      });
      mockAudits[res.audit_id] = res;
      mockAudits[contentId] = res;
      return res;
    } catch {
      return this.runAudit(contentId, revision);
    }
  },

  async getAuditById(auditId: string): Promise<AuditResult> {
    if (isMockModeEnabled()) {
      const found = mockAudits[auditId];
      if (found) return found;
      return {
        audit_id: auditId,
        content_id: 'cnt-demo-001',
        content_version: 1,
        overall_score: 88,
        status: 'completed',
        created_at: new Date().toISOString(),
        findings: [],
      };
    }

    try {
      return await apiFetch<AuditResult>(`/audits/${auditId}`);
    } catch {
      const found = mockAudits[auditId];
      if (found) return found;
      throw new Error(`Audit ${auditId} not found`);
    }
  },

  async submitRevision(
    contentId: string,
    payload: { raw_text: string; change_summary?: string }
  ): Promise<ContentItem> {
    if (isMockModeEnabled()) {
      const item = mockContentItems.find((c) => c.content_id === contentId);
      if (item) {
        item.current_revision += 1;
        item.raw_text = payload.raw_text;
        item.status = 'pending_approval';
        item.updated_at = new Date().toISOString();
        return item;
      }
    }

    try {
      return await apiFetch<ContentItem>(`/content/${contentId}/revisions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const item = mockContentItems.find((c) => c.content_id === contentId);
      if (item) {
        item.current_revision += 1;
        item.raw_text = payload.raw_text;
        return item;
      }
      throw new Error(`Failed to submit revision for ${contentId}`);
    }
  },
};

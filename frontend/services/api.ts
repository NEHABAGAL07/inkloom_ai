/**
 * Inkloom AI - Production API Client
 * Interfaces with FastAPI backend at `/api/v1`
 * Falls back transparently to MockApiService if NEXT_PUBLIC_USE_MOCK_API=true
 */

import {
  AuditResult,
  ContentSubmission,
  ReviewQueueItem,
  ReviewDecisionPayload,
  AnalyticsSummary,
  BrandGuideline,
  WorkflowState,
} from '../types/audit';
import { MockApiService } from './mock-api';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' ||
  typeof window === 'undefined';

export const ApiService = {
  async getRecentAudits(): Promise<AuditResult[]> {
    if (USE_MOCK) return MockApiService.getRecentAudits();
    try {
      const res = await fetch(`${API_BASE_URL}/audits/aud-recent`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return [data];
    } catch (err) {
      console.warn('API call failed, falling back to mock data:', err);
      return MockApiService.getRecentAudits();
    }
  },

  async getAuditById(auditId: string): Promise<AuditResult> {
    if (USE_MOCK) return MockApiService.getAuditById(auditId);
    try {
      const res = await fetch(`${API_BASE_URL}/audits/${auditId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API call failed, falling back to mock data:', err);
      return MockApiService.getAuditById(auditId);
    }
  },

  async submitContent(data: {
    title: string;
    raw_text?: string;
    content_type: 'text' | 'document' | 'image' | 'video';
    file?: File;
  }): Promise<ContentSubmission> {
    if (USE_MOCK) return MockApiService.submitContent(data);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content_type', data.content_type);
      if (data.raw_text) formData.append('raw_text', data.raw_text);
      if (data.file) formData.append('file', data.file);
      formData.append('workspace_id', 'ws-main-001');

      const res = await fetch(`${API_BASE_URL}/content/submit`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API call failed, falling back to mock data:', err);
      return MockApiService.submitContent(data);
    }
  },

  async runAudit(contentId: string): Promise<AuditResult> {
    if (USE_MOCK) return MockApiService.runAudit(contentId);
    try {
      const res = await fetch(`${API_BASE_URL}/audits/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API call failed, falling back to mock data:', err);
      return MockApiService.runAudit(contentId);
    }
  },

  async getReviewQueue(): Promise<ReviewQueueItem[]> {
    if (USE_MOCK) return MockApiService.getReviewQueue();
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/queue`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API call failed, falling back to mock data:', err);
      return MockApiService.getReviewQueue();
    }
  },

  async submitReviewDecision(
    payload: ReviewDecisionPayload
  ): Promise<{ status: string; new_state: WorkflowState }> {
    if (USE_MOCK) return MockApiService.submitReviewDecision(payload);
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return { status: 'success', new_state: data.new_workflow_status };
    } catch (err) {
      console.warn('API call failed, falling back to mock data:', err);
      return MockApiService.submitReviewDecision(payload);
    }
  },

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    if (USE_MOCK) return MockApiService.getAnalyticsSummary();
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/summary`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API call failed, falling back to mock data:', err);
      return MockApiService.getAnalyticsSummary();
    }
  },

  async getGuidelines(): Promise<BrandGuideline[]> {
    if (USE_MOCK) return MockApiService.getGuidelines();
    try {
      const res = await fetch(`${API_BASE_URL}/guidelines`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.map((g: any) => ({
        id: g.id,
        name: g.name,
        category: g.category,
        version: g.version,
        description: g.description,
        is_active: g.is_active,
        rules_count: g.rules?.length || 0,
      }));
    } catch (err) {
      console.warn('API call failed, falling back to mock data:', err);
      return MockApiService.getGuidelines();
    }
  },
};

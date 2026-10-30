"use client";

import { useEffect, useRef } from "react";

export interface RealtimeReviewEvent {
  event_type:
    | "review_cycle_started"
    | "department_review_submitted"
    | "cycle_completed"
    | "revision_created"
    | "final_approval_granted"
    | "feedback_added"
    | "heartbeat";
  organization_id?: string;
  cycle_id?: string;
  submission_id?: string;
  revision_id?: string;
  department?: string;
  outcome?: string;
  status?: string;
  reviewer_name?: string;
  timestamp: string;
  data?: any;
}

const EVENT_NAME = "inkloom_review_event";

/**
 * Broadcasts an event locally across the browser window so all active
 * components immediately update their UI without waiting for network polling.
 */
export function broadcastLocalReviewEvent(event: RealtimeReviewEvent): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: event }));
  }
}

/**
 * Subscribes to both local broadcast events and Server-Sent Events (SSE).
 */
export function subscribeToReviewEvents(
  listener: (event: RealtimeReviewEvent) => void,
  organizationId?: string
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  // 1. Listen for local window events
  const localHandler = (e: Event) => {
    const customEvent = e as CustomEvent<RealtimeReviewEvent>;
    if (customEvent.detail) {
      listener(customEvent.detail);
    }
  };
  window.addEventListener(EVENT_NAME, localHandler);

  // 2. Connect to backend SSE stream if in real API mode
  let eventSource: EventSource | null = null;
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  if (!useMock) {
    try {
      const orgParam = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
      eventSource = new EventSource(`${apiBase}/realtime/events${orgParam}`);

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeReviewEvent = JSON.parse(event.data);
          if (data && data.event_type !== "heartbeat") {
            listener(data);
          }
        } catch (err) {
          console.debug("Non-JSON or heartbeat SSE received:", event.data);
        }
      };

      eventSource.onerror = (err) => {
        // SSE errors are normal during development or server restarts; keep browser listener alive
        console.debug("Realtime SSE connection state:", eventSource?.readyState);
      };
    } catch (e) {
      console.debug("SSE initialization skipped:", e);
    }
  }

  return () => {
    window.removeEventListener(EVENT_NAME, localHandler);
    if (eventSource) {
      eventSource.close();
    }
  };
}

/**
 * React Hook for automatic real-time event subscription with cleanup.
 */
export function useRealtimeReviewEvents(
  onEvent?: (event: RealtimeReviewEvent) => void,
  organizationId?: string
): void {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const cleanup = subscribeToReviewEvents((event) => {
      if (handlerRef.current) {
        handlerRef.current(event);
      }
    }, organizationId);

    return cleanup;
  }, [organizationId]);
}


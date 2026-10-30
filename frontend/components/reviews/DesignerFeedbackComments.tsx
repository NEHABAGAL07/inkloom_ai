"use client";

import React from "react";
import { ContentSubmission } from "@/types";

export interface DesignerFeedbackCommentsProps {
  submissionId: string;
  submissionTitle?: string;
  contentType?: string;
  description?: string;
  rawText?: string;
  fileName?: string;
  mediaUrl?: string;
  submission?: ContentSubmission | null;
  isDesignerUpload?: boolean;
  hideSuggestions?: boolean;
}

/**
 * Legacy standalone Designer Upload & Suggestions for the designer block.
 * Retired in favor of the Centralized Claim Review (/reviews) and Designer New Feedback (/feedback) workflows.
 */
export function DesignerFeedbackComments(_props: DesignerFeedbackCommentsProps) {
  return null;
}

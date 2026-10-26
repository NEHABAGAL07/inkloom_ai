"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/services/auth-context";
import {
  AskQuestionResponse,
  CitationItem,
  ChatMessage,
  ChatSession,
  KnowledgeDocument,
  ChatStatusResponse,
} from "@/types";
import { ReportUnclearModal } from "@/components/guidelines/ReportUnclearModal";
import {
  Bot,
  Send,
  Sparkles,
  FileText,
  FileCheck2,
  Trash2,
  Plus,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  Loader2,
  MessageSquare,
  BookOpen,
  ChevronRight,
  ShieldAlert,
  Info,
  Clock,
  Layers,
  X,
  RotateCcw,
} from "lucide-react";

export default function BrandAssistantPage() {
  const { activeRole, activeOrgName } = useAuth();
  const isPrivileged = activeRole === "admin" || activeRole === "compliance_officer" || activeRole === "legal";

  // Tab State: "chat" or "documents"
  const [activeTab, setActiveTab] = useState<"chat" | "documents">("chat");

  // Sessions & Messages State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [chatStatus, setChatStatus] = useState<ChatStatusResponse | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);

  // Citation Inspector Modal / Sheet
  const [inspectedCitation, setInspectedCitation] = useState<CitationItem | null>(null);

  // Unclear Rule Escalation Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportQuestionRef, setReportQuestionRef] = useState("");

  // Document Management State
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback State: map of messageId -> { helpful: boolean, comment?: string, submitted: boolean }
  const [feedbackState, setFeedbackState] = useState<
    Record<string, { helpful?: boolean; comment?: string; isSubmitting?: boolean; showCommentBox?: boolean }>
  >({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Starter Questions
  const starterQuestions = [
    {
      title: "Logo on dark blue background",
      prompt: "Can I use a white logo on a dark blue background?",
    },
    {
      title: "Typography standards",
      prompt: "What are our primary font families and sizing rules for headlines?",
    },
    {
      title: "Mandatory disclaimers",
      prompt: "What are the mandatory disclaimers for promotional marketing content?",
    },
  ];

  // Load Sessions and Documents on Mount
  useEffect(() => {
    loadSessions();
    loadDocuments();
    loadChatStatus();
  }, []);

  const loadChatStatus = async () => {
    try {
      const status = await api.getChatStatus();
      setChatStatus(status);
    } catch (err) {
      console.warn("Unable to fetch chat status:", err);
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.getAssistantSessions();
      setSessions(res);
      if (res.length > 0 && !currentSessionId) {
        selectSession(res[0].id);
      }
    } catch (err) {
      console.error("Failed to load assistant sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    try {
      const detail = await api.getAssistantSession(sessionId);
      setMessages(detail.messages || []);
    } catch (err) {
      console.error("Failed to load session details:", err);
    }
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setQuestionInput("");
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await api.deleteAssistantSession(sessionId);
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      if (currentSessionId === sessionId) {
        if (updated.length > 0) {
          selectSession(updated[0].id);
        } else {
          startNewSession();
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.getKnowledgeDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error("Failed to load knowledge documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleAskQuestion = async (textToSend?: string) => {
    const q = (textToSend || questionInput).trim();
    if (!q || isAsking) return;

    setQuestionInput("");
    setLastFailedQuestion(null);
    setIsAsking(true);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp_u_${Date.now()}`,
      session_id: currentSessionId || "",
      role: "user",
      content: q,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res: AskQuestionResponse = await api.askAssistant({
        session_id: currentSessionId || undefined,
        question: q,
      });

      // Update current session ID if this was a new session
      if (!currentSessionId && res.session_id) {
        setCurrentSessionId(res.session_id);
        await loadSessions();
      }

      // Add assistant response
      const asstMsg: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        session_id: res.session_id,
        role: "assistant",
        content: res.answer,
        citations: res.citations,
        confidence: res.confidence,
        mode: res.mode || (res.confidence === "not_found" ? "extractive" : "llm"),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, asstMsg]);
    } catch (err: any) {
      console.error("Error asking brand assistant:", err);
      setLastFailedQuestion(q);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        session_id: currentSessionId || "",
        role: "assistant",
        content:
          "Unable to process your inquiry right now. Please check network connection or verify that documents are uploaded.",
        confidence: "not_found",
        mode: "extractive",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    setFeedbackState((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], helpful, showCommentBox: !helpful },
    }));

    try {
      await api.submitMessageFeedback(messageId, { helpful });
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  const handleFeedbackCommentSubmit = async (messageId: string) => {
    const comment = feedbackState[messageId]?.comment;
    const helpful = feedbackState[messageId]?.helpful ?? false;
    setFeedbackState((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], isSubmitting: true },
    }));

    try {
      await api.submitMessageFeedback(messageId, { helpful, comment });
      setFeedbackState((prev) => ({
        ...prev,
        [messageId]: { ...prev[messageId], isSubmitting: false, showCommentBox: false },
      }));
    } catch (err) {
      console.error("Failed to submit comment:", err);
      setFeedbackState((prev) => ({
        ...prev,
        [messageId]: { ...prev[messageId], isSubmitting: false },
      }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setUploadError("File exceeds maximum allowed size of 25MB.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const newDoc = await api.uploadKnowledgeDocument(file);
      setUploadSuccess(`"${newDoc.filename}" uploaded and ingested successfully.`);
      await loadDocuments();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"? All associated document chunks will be removed.`)) {
      return;
    }

    try {
      await api.deleteKnowledgeDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 py-4 sm:px-6">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            <span>Document Intelligence & Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-white flex items-center gap-2">
            Brand Guideline Assistant
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20">
              Grounded AI
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs text-ink-muted">
              Instant natural-language answers strictly verified against your organization's brand documents.
            </p>
            {chatStatus && (
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  chatStatus.llm_enabled
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    chatStatus.llm_enabled ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                {chatStatus.llm_enabled
                  ? `${chatStatus.model || "Gemini"} Online`
                  : "Extractive Fallback Active"}
              </span>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 rounded-xl bg-surface border border-border shadow-sm">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "chat"
                ? "bg-teal text-white shadow-sm"
                : "text-ink-secondary hover:text-ink-primary hover:bg-workspace"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Assistant Chat
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "documents"
                ? "bg-teal text-white shadow-sm"
                : "text-ink-secondary hover:text-ink-primary hover:bg-workspace"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Brand Documents
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "documents"
                  ? "bg-white text-teal"
                  : "bg-surface-accent text-ink-secondary border border-border"
              }`}
            >
              {documents.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "chat" ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 min-h-0">
          {/* Conversation History Sidebar */}
          <div className="hidden md:flex flex-col bg-surface border border-border rounded-xl p-3 shadow-sm min-h-0">
            <button
              onClick={startNewSession}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-teal text-white text-xs font-semibold shadow hover:bg-teal-600 transition mb-3"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>

            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted px-2 pb-1.5 flex items-center justify-between">
              <span>Past Sessions</span>
              <span>{sessions.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-8 text-ink-muted text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal" />
                  Loading...
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-ink-muted">
                  No previous conversations yet. Ask a question to begin.
                </div>
              ) : (
                sessions.map((s) => {
                  const isActive = s.id === currentSessionId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => selectSession(s.id)}
                      className={`group relative flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition ${
                        isActive
                          ? "bg-teal/10 text-teal dark:text-teal-300 font-semibold border border-teal/20"
                          : "text-ink-secondary hover:bg-workspace hover:text-ink-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0 pr-6">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{s.title || "Brand Assistant Inquiry"}</span>
                      </div>
                      <button
                        onClick={(e) => deleteSession(s.id, e)}
                        title="Delete Session"
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Chat Interface */}
          <div className="md:col-span-3 flex flex-col bg-surface border border-border rounded-xl shadow-sm min-h-0 overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal mb-3 shadow-inner">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-navy dark:text-white">
                    What brand rule would you like to verify?
                  </h3>
                  <p className="text-xs text-ink-muted mt-1 mb-6">
                    Ask questions grounded strictly in{" "}
                    <span className="font-semibold text-teal">{activeOrgName || "your workspace"}</span> brand guideline
                    documents.
                  </p>

                  <div className="w-full space-y-2 text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted px-1">
                      Suggested Inquiries
                    </div>
                    {starterQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskQuestion(q.prompt)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-workspace hover:border-teal/40 hover:bg-teal/5 transition text-xs group"
                      >
                        <span className="font-medium text-ink-primary group-hover:text-teal transition">
                          "{q.prompt}"
                        </span>
                        <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-teal transition shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  const isNotFound = msg.confidence === "not_found";

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm text-xs leading-relaxed ${
                          isUser
                            ? "bg-teal text-white rounded-br-xs"
                            : "bg-workspace border border-border text-ink-primary rounded-bl-xs"
                        }`}
                      >
                        {/* Header for Assistant */}
                        {!isUser && (
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-border/50 text-[11px]">
                            <div className="flex items-center gap-1.5 font-bold text-navy dark:text-white">
                              <Bot className="w-3.5 h-3.5 text-teal" />
                              <span>Brand Intelligence Assistant</span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Generation Mode Badge */}
                              {msg.mode === "llm" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal/10 text-teal dark:text-teal-300 border border-teal/20">
                                  <Sparkles className="w-2.5 h-2.5 text-teal" />
                                  AI-generated from your documents
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                                  <Layers className="w-2.5 h-2.5 text-slate-500" />
                                  Showing matching sections (AI summary unavailable)
                                </span>
                              )}

                              {/* Confidence Badge */}
                              {msg.confidence && (
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    msg.confidence === "high"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                      : msg.confidence === "medium"
                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                  }`}
                                >
                                  {msg.confidence === "not_found"
                                    ? "Rule Not Found"
                                    : `${msg.confidence.toUpperCase()} Confidence`}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Content text */}
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* Citations Section */}
                        {!isUser && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-2 flex items-center gap-1">
                              <FileCheck2 className="w-3 h-3 text-teal" />
                              <span>Grounded Citations ({msg.citations.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {msg.citations.map((cite, cIdx) => (
                                <button
                                  key={cIdx}
                                  onClick={() => setInspectedCitation(cite)}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-teal/30 hover:border-teal hover:bg-teal/5 text-[11px] font-medium text-teal transition shadow-2xs group"
                                >
                                  <FileText className="w-3 h-3 text-teal" />
                                  <span className="truncate max-w-[180px]">{cite.document_name}</span>
                                  {cite.page && (
                                    <span className="px-1 py-0.2 rounded bg-teal/10 text-[9px] font-bold">
                                      p. {cite.page}
                                    </span>
                                  )}
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Unclear / Missing Rule Escalation Banner */}
                        {!isUser && isNotFound && (
                          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                              <ShieldAlert className="w-4 h-4 shrink-0" />
                              <span className="text-[11px] font-medium">
                                No matching brand policy detected for this scenario.
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
                                setReportQuestionRef(lastUserMsg?.content || "");
                                setReportModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] transition shrink-0 shadow-xs"
                            >
                              Report Unclear / Missing Rule
                            </button>
                          </div>
                        )}

                        {/* Error Message with Retry Action */}
                        {!isUser && msg.id.startsWith("msg_err_") && lastFailedQuestion && (
                          <div className="mt-3 p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-ink-muted">Inquiry was not completed.</span>
                            <button
                              onClick={() => {
                                const retryQuery = lastFailedQuestion;
                                setLastFailedQuestion(null);
                                handleAskQuestion(retryQuery);
                              }}
                              disabled={isAsking}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal text-white font-semibold text-[10px] hover:bg-teal-600 transition shadow-2xs disabled:opacity-50"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Retry Question
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Assistant Feedback Controls */}
                      {!isUser && (
                        <div className="flex items-center gap-2 mt-1.5 px-1 text-[11px] text-ink-muted">
                          <span>Was this answer helpful?</span>
                          <button
                            onClick={() => handleFeedback(msg.id, true)}
                            className={`p-1 rounded hover:bg-surface transition ${
                              feedbackState[msg.id]?.helpful === true ? "text-emerald-500 font-bold" : "text-ink-muted"
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, false)}
                            className={`p-1 rounded hover:bg-surface transition ${
                              feedbackState[msg.id]?.helpful === false ? "text-rose-500 font-bold" : "text-ink-muted"
                            }`}
                            title="Not Helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Optional comment box trigger */}
                          {feedbackState[msg.id]?.showCommentBox && (
                            <div className="flex items-center gap-1.5 ml-2">
                              <input
                                type="text"
                                placeholder="Optional feedback..."
                                value={feedbackState[msg.id]?.comment || ""}
                                onChange={(e) =>
                                  setFeedbackState((prev) => ({
                                    ...prev,
                                    [msg.id]: { ...prev[msg.id], comment: e.target.value },
                                  }))
                                }
                                className="px-2 py-0.5 rounded border border-border bg-surface text-ink-primary text-xs w-48 focus:outline-teal"
                              />
                              <button
                                onClick={() => handleFeedbackCommentSubmit(msg.id)}
                                disabled={feedbackState[msg.id]?.isSubmitting}
                                className="px-2 py-0.5 rounded bg-teal text-white text-[10px] font-semibold hover:bg-teal-600"
                              >
                                Submit
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* In-Flight Thinking Skeleton */}
              {isAsking && (
                <div className="flex flex-col items-start max-w-[85%] sm:max-w-[78%]">
                  <div className="w-full rounded-2xl p-4 bg-workspace border border-border shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                      <div className="flex items-center gap-2 text-xs font-bold text-navy dark:text-white">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal" />
                        <span>Consulting brand documentation...</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20 animate-pulse">
                        Synthesizing answer
                      </span>
                    </div>
                    <div className="space-y-2 py-1">
                      <div className="h-3.5 bg-ink-muted/15 rounded-full w-full animate-pulse" />
                      <div className="h-3.5 bg-ink-muted/15 rounded-full w-4/5 animate-pulse" />
                      <div className="h-3.5 bg-ink-muted/15 rounded-full w-3/5 animate-pulse" />
                    </div>
                    <div className="text-[11px] text-ink-muted flex items-center gap-1.5 pt-1">
                      <Sparkles className="w-3 h-3 text-teal shrink-0" />
                      <span>Retrieving passages with BM25 & verifying grounding against rules...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-border bg-surface">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskQuestion();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  rows={2}
                  placeholder="Ask any brand question (e.g., 'Can I use a white logo on dark blue?')..."
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAskQuestion();
                    }
                  }}
                  disabled={isAsking}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-workspace text-ink-primary text-xs focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition placeholder:text-ink-muted resize-none"
                />
                <button
                  type="submit"
                  disabled={isAsking || !questionInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal hover:bg-teal-600 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition shrink-0 h-[42px]"
                >
                  {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Ask</span>
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-ink-muted mt-1.5 px-1">
                <span>Answers derive strictly from your workspace documents. Zero hallucinated rules.</span>
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Brand Documents Management Tab */
        <div className="flex-1 flex flex-col gap-4 pt-4 min-h-0 overflow-y-auto">
          {/* Uploader Card */}
          <div className="p-5 rounded-xl bg-surface border border-border shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-navy dark:text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-teal" />
                  Upload Brand Guidelines & Style Guides
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Supported formats: PDF, DOCX, TXT (up to 25MB). Documents are parsed page-by-page and indexed for
                  BM25 synonym retrieval.
                </p>
              </div>

              {isPrivileged ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="doc-file-upload"
                  />
                  <label
                    htmlFor="doc-file-upload"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-teal text-white text-xs font-semibold cursor-pointer shadow hover:bg-teal-600 transition ${
                      isUploading ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Ingesting Document...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Document</span>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-lg bg-surface-accent border border-border text-[11px] text-ink-muted flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  <span>Uploads restricted to Brand Admin or Legal & Compliance</span>
                </div>
              )}
            </div>

            {/* Status alerts */}
            {uploadSuccess && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}
            {uploadError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Documents Table */}
          <div className="flex-1 bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">
                Active Knowledge Documents ({documents.length})
              </div>
              <button
                onClick={loadDocuments}
                className="text-xs text-teal hover:underline flex items-center gap-1"
              >
                Refresh
              </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              {loadingDocs ? (
                <div className="flex items-center justify-center py-16 text-xs text-ink-muted gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal" />
                  Loading brand documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-ink-muted">
                  <FileText className="w-8 h-8 text-ink-muted/50 mb-2" />
                  <span>No documents uploaded yet.</span>
                  <span className="text-[11px] text-ink-muted/70 mt-0.5">
                    Upload your official brand manual PDF to ground the AI assistant.
                  </span>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-workspace/50 text-[10px] font-bold uppercase tracking-wider text-ink-muted border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Document Name</th>
                      <th className="py-3 px-4">Pages</th>
                      <th className="py-3 px-4">Indexed Chunks</th>
                      <th className="py-3 px-4">File Size</th>
                      <th className="py-3 px-4">Ingestion Status</th>
                      <th className="py-3 px-4">Date Uploaded</th>
                      {isPrivileged && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-workspace/40 transition">
                        <td className="py-3 px-4 font-semibold text-ink-primary flex items-center gap-2">
                          <FileText className="w-4 h-4 text-teal shrink-0" />
                          <span className="truncate max-w-xs">{doc.filename}</span>
                        </td>
                        <td className="py-3 px-4 text-ink-secondary">{doc.page_count || "—"}</td>
                        <td className="py-3 px-4 text-ink-secondary">
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Layers className="w-3 h-3 text-ink-muted" />
                            {doc.chunks_count || "Ready"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-ink-secondary">{formatFileSize(doc.file_size_bytes)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                              doc.status === "ready"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : doc.status === "processing"
                                ? "bg-teal/10 text-teal border-teal/20 animate-pulse"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-ink-muted">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
                        </td>
                        {isPrivileged && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                              className="p-1 rounded text-ink-muted hover:text-red-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Citation Inspector Modal / Slide-over */}
      {inspectedCitation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg p-5 shadow-2xl relative text-ink-primary animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setInspectedCitation(null)}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink-primary transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-teal text-xs font-bold uppercase tracking-wider mb-1">
              <FileCheck2 className="w-4 h-4" />
              <span>Verified Source Citation</span>
            </div>
            <h3 className="text-base font-bold text-navy dark:text-white truncate pr-8">
              {inspectedCitation.document_name}
            </h3>

            <div className="flex items-center gap-3 text-xs text-ink-muted mt-1 mb-4 pb-3 border-b border-border">
              {inspectedCitation.page && (
                <span className="px-2 py-0.5 rounded bg-teal/10 text-teal font-semibold text-[11px]">
                  Page {inspectedCitation.page}
                </span>
              )}
              {inspectedCitation.section && <span>Section: {inspectedCitation.section}</span>}
              <span className="capitalize">Source: {inspectedCitation.source_type}</span>
            </div>

            <div className="text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                Verbatim Extracted Snippet
              </div>
              <div className="p-3 rounded-lg bg-workspace border border-border text-ink-primary font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto">
                "{inspectedCitation.snippet}"
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setInspectedCitation(null)}
                className="px-4 py-1.5 rounded-lg bg-teal text-white text-xs font-semibold hover:bg-teal-600 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Unclear Rule Modal */}
      {reportModalOpen && (
        <ReportUnclearModal
          initialRuleReference={reportQuestionRef}
          onClose={() => setReportModalOpen(false)}
        />
      )}
    </div>
  );
}

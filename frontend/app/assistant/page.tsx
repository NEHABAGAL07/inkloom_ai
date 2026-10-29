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
    <div className="flex flex-col h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-8.5rem)] min-h-[500px] max-w-7xl mx-auto">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#DDEBE5] dark:border-[#383838]">
        <div>
          <div className="flex items-center gap-2 text-ink-primary font-bold uppercase tracking-wider text-[11px]">
            <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFD84D] dark:to-[#F45B91] flex items-center justify-center text-white dark:text-ink-950 shadow-sm shadow-teal/20 dark:shadow-orange-500/20">
              <Bot className="w-3.5 h-3.5" />
            </span>
            <span className="text-gradient-warm font-mono">Document Intelligence &amp; Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18352F] dark:text-[#F7F3ED] font-heading flex items-center gap-2 mt-1">
            Brand Guideline Assistant
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-amber-500/10 dark:text-[#FFAA35] dark:border-amber-500/20">
              Grounded AI
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs text-[#58716A] dark:text-[#85817D]">
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
                    chatStatus.llm_enabled ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse" : "bg-amber-500 dark:bg-amber-400"
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
        <div className="flex items-center p-1 rounded-xl bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] shadow-subtle dark:shadow-sm">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "chat"
                ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-gradient-to-r dark:from-[#FFAA35] dark:to-[#FF665C] dark:text-ink-950 dark:border-transparent font-bold shadow-xs dark:shadow-orange-500/20"
                : "text-[#58716A] hover:text-[#18352F] hover:bg-[#EFF8F4] dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] dark:hover:bg-[#272727]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Assistant Chat
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "documents"
                ? "bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-gradient-to-r dark:from-[#FFAA35] dark:to-[#FF665C] dark:text-ink-950 dark:border-transparent font-bold shadow-xs dark:shadow-orange-500/20"
                : "text-[#58716A] hover:text-[#18352F] hover:bg-[#EFF8F4] dark:text-[#B8B2AC] dark:hover:text-[#F7F3ED] dark:hover:bg-[#272727]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Brand Documents
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "documents"
                  ? "bg-[#087F70] text-white dark:bg-ink-950 dark:text-[#FFAA35]"
                  : "bg-[#EFF8F4] text-[#58716A] border border-[#DDEBE5] dark:bg-[#272727] dark:text-[#B8B2AC] dark:border-[#383838]"
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
          <div className="hidden md:flex flex-col bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] rounded-2xl p-3 shadow-subtle dark:shadow-xl min-h-0">
            <button
              onClick={startNewSession}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl btn-gradient-warm text-white dark:text-ink-950 text-xs font-bold shadow-warmGlow dark:shadow-orange-500/10 transition mb-3"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>

            <div className="text-[10px] font-bold uppercase tracking-wider text-[#58716A] dark:text-[#85817D] px-2 pb-1.5 flex items-center justify-between">
              <span>Past Sessions</span>
              <span className="px-1.5 py-0.5 rounded bg-[#EFF8F4] dark:bg-[#272727] text-[#58716A] dark:text-[#B8B2AC] border border-[#DDEBE5] dark:border-transparent font-mono">{sessions.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-8 text-[#58716A] dark:text-[#85817D] text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#087F70] dark:text-[#FF7A36]" />
                  Loading...
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#58716A] dark:text-[#85817D]">
                  No previous conversations yet. Ask a question to begin.
                </div>
              ) : (
                sessions.map((s) => {
                  const isActive = s.id === currentSessionId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => selectSession(s.id)}
                      className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition ${
                        isActive
                          ? "bg-[#E8F7F1] text-[#087F70] font-semibold border border-[#C8E2D8] dark:bg-gradient-to-r dark:from-amber-500/15 dark:to-orange-500/10 dark:text-[#F7F3ED] dark:border-amber-500/30"
                          : "text-[#58716A] hover:bg-[#EFF8F4] hover:text-[#18352F] dark:text-[#B8B2AC] dark:hover:bg-[#202020] dark:hover:text-[#F7F3ED] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0 pr-6">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#087F70] dark:text-[#FFAA35]" : "opacity-60"}`} />
                        <span className="truncate">{s.title || "Brand Assistant Inquiry"}</span>
                      </div>
                      <button
                        onClick={(e) => deleteSession(s.id, e)}
                        title="Delete Session"
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 transition p-1 shrink-0"
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
          <div className="md:col-span-3 flex flex-col bg-white dark:bg-[#1C1C1C] border border-[#DDEBE5] dark:border-[#383838] rounded-2xl shadow-subtle dark:shadow-xl min-h-0 overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#087F70]/10 via-[#10A995]/10 to-[#43D6B3]/10 dark:from-[#FFD84D]/10 dark:via-[#FF7A36]/10 dark:to-[#F45B91]/10 border border-[#C8E2D8] dark:border-amber-500/30 flex items-center justify-center text-[#087F70] dark:text-[#FFAA35] mb-4 shadow-inner">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[#18352F] dark:text-[#F7F3ED] font-heading">
                    What brand rule would you like to verify?
                  </h3>
                  <p className="text-xs text-[#58716A] dark:text-[#85817D] mt-1 mb-6">
                    Ask questions grounded strictly in{" "}
                    <span className="font-semibold text-[#087F70] dark:text-[#FFAA35]">{activeOrgName || "your workspace"}</span> brand guideline
                    documents.
                  </p>

                  <div className="w-full space-y-2.5 text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#58716A] dark:text-[#85817D] px-1 font-mono">
                      Suggested Inquiries
                    </div>
                    {starterQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskQuestion(q.prompt)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#DDEBE5] dark:border-[#383838] bg-[#F7FBF9] dark:bg-[#202020] hover:border-[#10A995] dark:hover:border-amber-500/40 hover:bg-[#EFF8F4] dark:hover:bg-[#272727] transition text-xs group"
                      >
                        <span className="font-medium text-[#18352F] dark:text-[#B8B2AC] group-hover:text-[#087F70] dark:group-hover:text-[#F7F3ED] transition">
                          "{q.prompt}"
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#82948E] dark:text-[#85817D] group-hover:text-[#087F70] dark:group-hover:text-[#FFAA35] transition shrink-0 ml-2" />
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
                        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-subtle dark:shadow-md text-xs leading-relaxed ${
                          isUser
                            ? "bg-gradient-to-r from-[#087F70] via-[#10A995] to-[#43D6B3] dark:from-[#FFAA35] dark:via-[#FF7A36] dark:to-[#F45B91] text-white dark:text-ink-950 font-medium rounded-br-xs shadow-warmGlow dark:shadow-orange-500/10"
                            : "bg-[#F7FBF9] dark:bg-[#202020] border border-[#DDEBE5] dark:border-[#383838] text-[#18352F] dark:text-[#F7F3ED] rounded-bl-xs"
                        }`}
                      >
                        {/* Header for Assistant */}
                        {!isUser && (
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#DDEBE5] dark:border-[#383838] text-[11px]">
                            <div className="flex items-center gap-1.5 font-bold text-[#18352F] dark:text-[#F7F3ED]">
                              <Bot className="w-3.5 h-3.5 text-[#087F70] dark:text-[#FFAA35]" />
                              <span>Brand Intelligence Assistant</span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Generation Mode Badge */}
                              {msg.mode === "llm" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F7F1] text-[#087F70] border border-[#C8E2D8] dark:bg-amber-500/10 dark:text-[#FFAA35] dark:border-amber-500/20">
                                  <Sparkles className="w-2.5 h-2.5 text-[#087F70] dark:text-[#FFAA35]" />
                                  AI-grounded
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF8F4] text-[#58716A] border border-[#DDEBE5] dark:bg-[#272727] dark:text-[#B8B2AC] dark:border-[#383838]">
                                  <Layers className="w-2.5 h-2.5 text-[#58716A] dark:text-[#85817D]" />
                                  Extractive Match
                                </span>
                              )}

                              {/* Confidence Badge */}
                              {msg.confidence && (
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    msg.confidence === "high"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : msg.confidence === "medium"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
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
                          <div className="mt-3 pt-3 border-t border-[#383838]">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#85817D] mb-2 flex items-center gap-1 font-mono">
                              <FileCheck2 className="w-3 h-3 text-[#FFAA35]" />
                              <span>Grounded Citations ({msg.citations.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {msg.citations.map((cite, cIdx) => (
                                <button
                                  key={cIdx}
                                  onClick={() => setInspectedCitation(cite)}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#272727] border border-[#383838] hover:border-amber-500/50 hover:bg-[#202020] text-[11px] font-medium text-[#FFAA35] transition group"
                                >
                                  <FileText className="w-3 h-3 text-[#FFAA35]" />
                                  <span className="truncate max-w-[180px]">{cite.document_name}</span>
                                  {cite.page && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-[9px] font-bold text-[#FFD84D]">
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
                          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-rose-300">
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
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] transition shrink-0 shadow-xs"
                            >
                              Report Unclear / Missing Rule
                            </button>
                          </div>
                        )}

                        {/* Error Message with Retry Action */}
                        {!isUser && msg.id.startsWith("msg_err_") && lastFailedQuestion && (
                          <div className="mt-3 p-2.5 rounded-xl bg-[#272727] border border-[#383838] flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-[#85817D]">Inquiry was not completed.</span>
                            <button
                              onClick={() => {
                                const retryQuery = lastFailedQuestion;
                                setLastFailedQuestion(null);
                                handleAskQuestion(retryQuery);
                              }}
                              disabled={isAsking}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#FFAA35] to-[#FF7A36] text-ink-950 font-bold text-[10px] transition shadow-xs disabled:opacity-50"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Retry Question
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Assistant Feedback Controls */}
                      {!isUser && (
                        <div className="flex items-center gap-2 mt-1.5 px-1 text-[11px] text-[#85817D]">
                          <span>Was this answer helpful?</span>
                          <button
                            onClick={() => handleFeedback(msg.id, true)}
                            className={`p-1 rounded hover:bg-[#202020] transition ${
                              feedbackState[msg.id]?.helpful === true ? "text-emerald-400 font-bold" : "text-[#85817D]"
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, false)}
                            className={`p-1 rounded hover:bg-[#202020] transition ${
                              feedbackState[msg.id]?.helpful === false ? "text-rose-400 font-bold" : "text-[#85817D]"
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
                                className="px-2.5 py-1 rounded-lg border border-[#383838] bg-[#141414] text-[#F7F3ED] text-xs w-48 focus:outline-none focus:border-amber-500"
                              />
                              <button
                                onClick={() => handleFeedbackCommentSubmit(msg.id)}
                                disabled={feedbackState[msg.id]?.isSubmitting}
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#FFAA35] to-[#FF7A36] text-ink-950 text-[10px] font-bold"
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
                  <div className="w-full rounded-2xl p-4 bg-[#202020] border border-[#383838] shadow-lg space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#383838]">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#F7F3ED]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFAA35]" />
                        <span>Consulting brand documentation...</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-[#FFAA35] border border-amber-500/20 animate-pulse">
                        Synthesizing answer
                      </span>
                    </div>
                    <div className="space-y-2 py-1">
                      <div className="h-3.5 bg-[#272727] rounded-full w-full animate-pulse" />
                      <div className="h-3.5 bg-[#272727] rounded-full w-4/5 animate-pulse" />
                      <div className="h-3.5 bg-[#272727] rounded-full w-3/5 animate-pulse" />
                    </div>
                    <div className="text-[11px] text-[#85817D] flex items-center gap-1.5 pt-1">
                      <Sparkles className="w-3 h-3 text-[#FFAA35] shrink-0" />
                      <span>Retrieving passages with BM25 &amp; verifying grounding against rules...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-[#DDEBE5] dark:border-[#383838] bg-white dark:bg-[#171717]">
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
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#DDEBE5] dark:border-[#383838] bg-[#F7FBF9] dark:bg-[#141414] text-[#18352F] dark:text-[#F7F3ED] text-xs focus:outline-none focus:ring-1 focus:ring-[#10A995] focus:border-[#10A995] dark:focus:ring-[#FF7A36] dark:focus:border-[#FF7A36] transition placeholder:text-[#82948E] dark:placeholder:text-[#85817D] resize-none"
                />
                <button
                  type="submit"
                  disabled={isAsking || !questionInput.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-gradient-warm disabled:opacity-50 text-white dark:text-ink-950 font-bold text-xs shadow-warmGlow dark:shadow-orange-500/10 transition shrink-0 h-[42px]"
                >
                  {isAsking ? <Loader2 className="w-4 h-4 animate-spin text-white dark:text-ink-950" /> : <Send className="w-4 h-4 text-white dark:text-ink-950" />}
                  <span>Ask</span>
                </button>
              </form>
              <div className="flex items-center justify-between text-[10px] text-[#58716A] dark:text-[#85817D] mt-1.5 px-1 font-mono">
                <span>Answers derive strictly from workspace documents. Zero hallucinated rules.</span>
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Brand Documents Management Tab */
        <div className="flex-1 flex flex-col gap-4 pt-4 min-h-0 overflow-y-auto">
          {/* Uploader Card */}
          <div className="p-5 rounded-2xl bg-[#1C1C1C] border border-[#383838] shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#F7F3ED] font-heading flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-[#FFAA35]" />
                  Upload Brand Guidelines &amp; Style Guides
                </h3>
                <p className="text-xs text-[#85817D] mt-0.5">
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl btn-gradient-warm text-ink-950 text-xs font-bold cursor-pointer shadow-lg shadow-orange-500/10 transition ${
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
                <div className="px-3 py-1.5 rounded-xl bg-[#202020] border border-[#383838] text-[11px] text-[#85817D] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#FFAA35]" />
                  <span>Uploads restricted to Brand Admin or Legal &amp; Compliance</span>
                </div>
              )}
            </div>

            {/* Status alerts */}
            {uploadSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}
            {uploadError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Documents Table */}
          <div className="flex-1 bg-[#1C1C1C] border border-[#383838] rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#383838] flex items-center justify-between">
              <div className="text-xs font-bold text-[#F7F3ED] uppercase tracking-wider font-mono">
                Active Knowledge Documents ({documents.length})
              </div>
              <button
                onClick={loadDocuments}
                className="text-xs text-[#FFAA35] hover:underline flex items-center gap-1"
              >
                Refresh
              </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              {loadingDocs ? (
                <div className="flex items-center justify-center py-16 text-xs text-[#85817D] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF7A36]" />
                  Loading brand documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-[#85817D]">
                  <FileText className="w-8 h-8 text-[#85817D]/50 mb-2" />
                  <span>No documents uploaded yet.</span>
                  <span className="text-[11px] text-[#85817D]/70 mt-0.5">
                    Upload your official brand manual PDF to ground the AI assistant.
                  </span>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#171717] text-[10px] font-bold uppercase tracking-wider text-[#85817D] border-b border-[#383838] font-mono">
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
                  <tbody className="divide-y divide-[#383838]">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#202020] transition">
                        <td className="py-3 px-4 font-semibold text-[#F7F3ED] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#FFAA35] shrink-0" />
                          <span className="truncate max-w-xs">{doc.filename}</span>
                        </td>
                        <td className="py-3 px-4 text-[#B8B2AC]">{doc.page_count || "—"}</td>
                        <td className="py-3 px-4 text-[#B8B2AC]">
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Layers className="w-3 h-3 text-[#85817D]" />
                            {doc.chunks_count || "Ready"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#B8B2AC]">{formatFileSize(doc.file_size_bytes)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                              doc.status === "ready"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : doc.status === "processing"
                                ? "bg-amber-500/10 text-[#FFAA35] border-amber-500/20 animate-pulse"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#85817D]">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
                        </td>
                        {isPrivileged && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                              className="p-1 rounded text-[#85817D] hover:text-red-400 hover:bg-rose-950/30 transition"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] border border-[#383838] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-[#F7F3ED] animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setInspectedCitation(null)}
              className="absolute top-4 right-4 text-[#85817D] hover:text-[#F7F3ED] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-ink-primary text-xs font-bold uppercase tracking-wider mb-1 font-mono">
              <span className="w-5 h-5 rounded bg-gradient-to-br from-[#FFD84D] to-[#F45B91] flex items-center justify-center text-ink-950">
                <FileCheck2 className="w-3 h-3" />
              </span>
              <span className="text-gradient-warm">Verified Source Citation</span>
            </div>
            <h3 className="text-base font-bold text-[#F7F3ED] font-heading truncate pr-8">
              {inspectedCitation.document_name}
            </h3>

            <div className="flex items-center gap-3 text-xs text-[#85817D] mt-1 mb-4 pb-3 border-b border-[#383838]">
              {inspectedCitation.page && (
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-[#FFAA35] font-semibold text-[11px] border border-amber-500/30">
                  Page {inspectedCitation.page}
                </span>
              )}
              {inspectedCitation.section && <span>Section: {inspectedCitation.section}</span>}
              <span className="capitalize">Source: {inspectedCitation.source_type}</span>
            </div>

            <div className="text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#85817D] mb-1.5 font-mono">
                Verbatim Extracted Snippet
              </div>
              <div className="p-3.5 rounded-xl bg-[#141414] border border-[#383838] text-[#F7F3ED] font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto">
                "{inspectedCitation.snippet}"
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setInspectedCitation(null)}
                className="px-4 py-2 rounded-xl btn-dark-secondary text-xs font-semibold"
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

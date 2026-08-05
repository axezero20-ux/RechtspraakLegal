import { useState, useRef, useEffect } from "react";
import {
  Loader2, Send, FileText, Sparkles, Download, ArrowLeft,
  MessageSquare, ScrollText, AlertCircle, Scale, Link2, Trash2, X, Save,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ApiConfig, CaseContent, ChatMessage, CaseAnalysis, PrecedentAnalysis } from "../types";
import { getCaseContent, flexibleChat, summarizeCase } from "../api";
import { exportToPDF } from "../pdfExport";
import { fetchCaseView, upsertCaseView, fetchEcliCaseView, upsertEcliCaseView } from "../mattersApi";
import CaseAnalysisPanel from "./CaseAnalysisPanel";
import SimilarPrecedentsPanel from "./SimilarPrecedentsPanel";

interface Props {
  ecli: string;
  config: ApiConfig;
  onBack: () => void;
  onCaseSelect: (ecli: string) => void;
  source?: "search" | "ecli";
}

type Tab = "summary" | "analysis" | "precedents" | "chat" | "text";

export default function CaseViewer({ ecli, config, onBack, onCaseSelect, source = "search" }: Props) {
  const [caseContent, setCaseContent] = useState<CaseContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [precedents, setPrecedents] = useState<PrecedentAnalysis | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCase();
  }, [ecli]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadCase() {
    setLoading(true);
    setError(null);
    setSummary(null);
    setSummaryError(null);
    setMessages([]);
    setAnalysis(null);
    setPrecedents(null);
    setSaveError(null);
    setLastSavedAt(null);
    try {
      const content = await getCaseContent(ecli);
      setCaseContent(content);
      const saved = source === "ecli" ? await fetchEcliCaseView(ecli) : await fetchCaseView(ecli);
      if (saved) {
        setSummary(saved.summary);
        setAnalysis(saved.analysis);
        setPrecedents(saved.precedents);
        setMessages(saved.chat || []);
        setLastSavedAt(saved.updated_at);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSummary() {
    if (!caseContent || summaryLoading) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const sum = await summarizeCase(config, caseContent);
      setSummary(sum);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || !caseContent || chatLoading) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setChatLoading(true);
    try {
      const { response, fetchedECLIs } = await flexibleChat(
        config,
        [...messages, userMessage],
        { ecli: caseContent.ecli, text: caseContent.text },
      );
      let displayResponse = response;
      if (fetchedECLIs.length > 0) {
        displayResponse = `*Fetched and analyzed ${fetchedECLIs.length} referenced case${fetchedECLIs.length > 1 ? "s" : ""}: ${fetchedECLIs.join(", ")}*\n\n${response}`;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: displayResponse, timestamp: Date.now() }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "AI request failed"}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const saved = source === "ecli"
        ? await upsertEcliCaseView(ecli, {
            title: caseContent?.metadata?.title || null,
            summary,
            analysis,
            precedents,
            chat: messages.length > 0 ? messages : null,
          })
        : await upsertCaseView(ecli, {
            title: caseContent?.metadata?.title || null,
            summary,
            analysis,
            precedents,
            chat: messages.length > 0 ? messages : null,
          });
      setLastSavedAt(saved.updated_at);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    if (!caseContent) return;
    const title = caseContent.metadata?.title || caseContent.ecli;
    exportToPDF({
      caseContent,
      summary: summary || undefined,
      messages: messages.length > 0 ? messages : undefined,
      analysis: analysis || undefined,
      precedents: precedents || undefined,
      title,
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading case {ecli}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  if (!caseContent) return null;

  const meta = caseContent.metadata;

  const tabs = [
    { id: "summary" as Tab, label: "AI Summary", icon: Sparkles },
    { id: "analysis" as Tab, label: "Analysis", icon: Scale },
    { id: "precedents" as Tab, label: "Precedents", icon: Link2 },
    { id: "chat" as Tab, label: "Ask Questions", icon: MessageSquare },
    { id: "text" as Tab, label: "Case Text", icon: ScrollText },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex-1 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-mono font-medium rounded">{caseContent.ecli}</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 line-clamp-2">
            {meta?.title || caseContent.ecli}
          </h2>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
            {meta?.creator && <span>Court: {meta.creator}</span>}
            {meta?.date && <span>Date: {meta.date}</span>}
            {meta?.zaaknummer && <span>Case: {meta.zaaknummer}</span>}
            {meta?.subject && <span>Subject: {meta.subject}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {lastSavedAt && (
            <span className="text-xs text-slate-400">
              Saved {new Date(lastSavedAt).toLocaleString("nl-NL")}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-all"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-4 py-2 rounded-lg mt-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {saveError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mt-4 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              tab === t.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto mt-4">
        <div className={tab === "summary" ? "block" : "hidden"}>
          <div className="space-y-4">
            {summaryLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-slate-500">AI is analyzing the case...</p>
                <p className="text-xs text-slate-400 mt-1">This may take a few seconds</p>
              </div>
            ) : summary ? (
              <div>
                <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600 prose-table:w-full prose-th:px-3 prose-th:py-2 prose-th:text-xs prose-th:font-semibold prose-th:text-slate-700 prose-th:bg-slate-100 prose-th:border prose-th:border-slate-300 prose-td:px-3 prose-td:py-2 prose-td:text-sm prose-td:text-slate-600 prose-td:border prose-td:border-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                </div>
                <button
                  onClick={handleGenerateSummary}
                  className="mt-6 flex items-center gap-2 px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Regenerate Summary
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="w-12 h-12 text-blue-100 mb-4" />
                <p className="text-base font-medium text-slate-700 mb-1">Generate an AI Summary</p>
                <p className="text-sm text-slate-400 mb-6 max-w-xs">
                  Let AI analyze this case and produce a structured summary of the key facts, arguments, and ruling.
                </p>
                {summaryError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg mb-4 max-w-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{summaryError}</span>
                  </div>
                )}
                <button
                  onClick={handleGenerateSummary}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Summary
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={tab === "analysis" ? "block" : "hidden"}>
          <CaseAnalysisPanel caseContent={caseContent} config={config} analysis={analysis} onAnalysisChange={setAnalysis} />
        </div>

        <div className={tab === "precedents" ? "block" : "hidden"}>
          <SimilarPrecedentsPanel caseContent={caseContent} config={config} onCaseSelect={onCaseSelect} precedents={precedents} onPrecedentsChange={setPrecedents} />
        </div>

        <div className={tab === "chat" ? "flex flex-col h-full" : "hidden"}>
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="w-10 h-10 text-slate-300 mb-2" strokeWidth={1} />
                  <p className="text-sm text-slate-400">Ask anything — case analysis, comparisons, general legal questions</p>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center max-w-lg">
                    {[
                      "What is this case about?",
                      "What was the court's decision?",
                      "Compare this with ECLI:NL:RBDHA:2023:1234",
                      "What are similar cases to this one?",
                      "Explain the legal reasoning",
                      "Draft a case note for this ruling",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-full hover:bg-slate-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-slate-100 text-slate-700 rounded-bl-md"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-table:my-2 prose-th:px-3 prose-th:py-1.5 prose-th:text-xs prose-th:font-semibold prose-th:text-slate-700 prose-th:bg-slate-200 prose-th:border prose-th:border-slate-300 prose-td:px-3 prose-td:py-1.5 prose-td:text-xs prose-td:text-slate-600 prose-td:border prose-td:border-slate-200 prose-tr:border-slate-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-200">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask anything — questions, comparisons (use ECLI:...), commands..."
                disabled={chatLoading}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all disabled:opacity-50"
              />
              {messages.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  disabled={chatLoading}
                  title="Clear conversation"
                  className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={chatLoading || !input.trim()}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
        </div>

        <div className={tab === "text" ? "block" : "hidden"}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FileText className="w-4 h-4" />
              <span>Full case text ({caseContent.fullLength.toLocaleString()} characters)</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {caseContent.text}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">Clear conversation?</h3>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-slate-600">
                This will permanently delete all questions and answers in this conversation. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
              >
                No, keep it
              </button>
              <button
                onClick={() => {
                  setMessages([]);
                  setShowClearConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all"
              >
                Yes, clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

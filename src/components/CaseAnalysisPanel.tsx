import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles, Loader2, AlertCircle, Scale, Gavel, BookOpen,
  Calendar, FileText, Lightbulb, ChevronRight, Gavel as GavelIcon,
} from "lucide-react";
import type { ApiConfig, CaseAnalysis, CaseContent } from "../types";
import { analyzeCase } from "../api";

function tryParseAnalysis(raw: string): CaseAnalysis | null {
  if (!raw) return null;
  try {
    let text = raw.trim();
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1].trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) text = text.slice(firstBrace, lastBrace + 1);
    return JSON.parse(text) as CaseAnalysis;
  } catch {
    return null;
  }
}

interface Props {
  caseContent: CaseContent;
  config: ApiConfig;
  analysis: CaseAnalysis | null;
  onAnalysisChange: (a: CaseAnalysis | null) => void;
}

type Section = "principles" | "arguments" | "legislation" | "references" | "timeline";

const SECTIONS: { id: Section; label: string; icon: typeof Scale }[] = [
  { id: "principles", label: "Legal Principles", icon: Scale },
  { id: "arguments", label: "Key Arguments", icon: GavelIcon },
  { id: "legislation", label: "Cited Legislation", icon: BookOpen },
  { id: "references", label: "Referenced Cases", icon: FileText },
  { id: "timeline", label: "Timeline", icon: Calendar },
];

export default function CaseAnalysisPanel({ caseContent, config, analysis, onAnalysisChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("principles");

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeCase(config, caseContent);
      onAnalysisChange(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500">AI is analyzing the case...</p>
        <p className="text-xs text-slate-400 mt-1">Extracting principles, arguments, legislation, and timeline</p>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={handleAnalyze}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
        </div>
        <p className="text-base font-medium text-slate-700 mb-1">Deep Legal Analysis</p>
        <p className="text-sm text-slate-400 mb-6 max-w-sm">
          AI will extract legal principles, key arguments, cited legislation, referenced cases, and a timeline of events.
        </p>
        <button
          onClick={handleAnalyze}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          Run Analysis
        </button>
      </div>
    );
  }

  const hasRaw = !analysis.legalPrinciples && analysis.rawAnalysis;
  const parsedFromRaw = hasRaw ? tryParseAnalysis(analysis.rawAnalysis!) : null;
  const a = parsedFromRaw || analysis;

  if (hasRaw && !parsedFromRaw) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Sparkles className="w-4 h-4" />
          <span>AI Analysis (unstructured)</span>
        </div>
        <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600 prose-table:w-full prose-th:px-3 prose-th:py-2 prose-th:text-xs prose-th:font-semibold prose-th:text-slate-700 prose-th:bg-slate-100 prose-th:border prose-th:border-slate-300 prose-td:px-3 prose-td:py-2 prose-td:text-sm prose-td:text-slate-600 prose-td:border prose-td:border-slate-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.rawAnalysis!}</ReactMarkdown>
        </div>
        <button
          onClick={handleAnalyze}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Regenerate Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-700">Legal Area</span>
          </div>
          <p className="text-sm text-slate-700">{a.legalArea || "Not identified"}</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <div className="flex items-center gap-2 mb-1">
            <Gavel className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">Outcome</span>
          </div>
          <p className="text-sm text-slate-700">{a.outcome || "Not identified"}</p>
        </div>
      </div>

      {a.significance && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-700 mb-1">Legal Significance</p>
              <p className="text-sm text-slate-600">{a.significance}</p>
            </div>
          </div>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-1">
        {SECTIONS.map((s) => {
          const count = getSectionCount(a, s.id);
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all ${
                activeSection === s.id
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeSection === s.id ? "bg-blue-200 text-blue-700" : "bg-slate-200 text-slate-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <div className="min-h-[200px]">
        {activeSection === "principles" && (
          <div className="space-y-2">
            {a.legalPrinciples?.length > 0 ? (
              a.legalPrinciples.map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                  </div>
                  <p className="text-sm text-slate-700">{p}</p>
                </div>
              ))
            ) : (
              <EmptyState message="No legal principles extracted" />
            )}
          </div>
        )}

        {activeSection === "arguments" && (
          <div className="space-y-2">
            {a.keyArguments?.length > 0 ? (
              a.keyArguments.map((arg, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500">{a.party || "Unknown party"}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getOutcomeColor(arg.outcome)}`}>
                      {arg.outcome || "Unknown"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{arg.argument}</p>
                </div>
              ))
            ) : (
              <EmptyState message="No key arguments extracted" />
            )}
          </div>
        )}

        {activeSection === "legislation" && (
          <div className="space-y-2">
            {a.citedLegislation?.length > 0 ? (
              a.citedLegislation.map((l, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{l.title}</span>
                  </div>
                  {l.articles?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {l.articles.map((art, j) => (
                        <span key={j} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded font-mono">
                          {art}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500">{l.relevance}</p>
                </div>
              ))
            ) : (
              <EmptyState message="No legislation cited" />
            )}
          </div>
        )}

        {activeSection === "references" && (
          <div className="space-y-2">
            {a.referencedCases?.length > 0 ? (
              a.referencedCases.map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-xs font-mono text-blue-600 font-medium">{r.ecli || "N/A"}</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-1">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.how}</p>
                </div>
              ))
            ) : (
              <EmptyState message="No referenced cases found" />
            )}
          </div>
        )}

        {activeSection === "timeline" && (
          <div className="space-y-2">
            {a.timeline?.length > 0 ? (
              <div className="relative pl-6">
                <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-slate-200" />
                {a.timeline.map((t, i) => (
                  <div key={i} className="relative pb-4 last:pb-0">
                    <div className="absolute -left-[18px] top-1 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-blue-50" />
                    <p className="text-xs font-medium text-blue-600 mb-0.5">{t.date}</p>
                    <p className="text-sm text-slate-700">{t.event}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No timeline events found" />
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleAnalyze}
        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        Regenerate Analysis
      </button>
    </div>
  );
}

function getSectionCount(analysis: CaseAnalysis, section: Section): number {
  switch (section) {
    case "principles": return analysis.legalPrinciples?.length || 0;
    case "arguments": return analysis.keyArguments?.length || 0;
    case "legislation": return analysis.citedLegislation?.length || 0;
    case "references": return analysis.referencedCases?.length || 0;
    case "timeline": return analysis.timeline?.length || 0;
    default: return 0;
  }
}

function getOutcomeColor(outcome: string): string {
  const o = (outcome || "").toLowerCase();
  if (o.includes("accept")) return "bg-green-100 text-green-700";
  if (o.includes("reject")) return "bg-red-100 text-red-700";
  if (o.includes("partial")) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <ChevronRight className="w-6 h-6 text-slate-300 mb-2" strokeWidth={1.5} />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

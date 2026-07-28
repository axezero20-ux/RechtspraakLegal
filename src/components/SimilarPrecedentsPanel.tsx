import { useState, useEffect } from "react";
import {
  Sparkles, Loader2, AlertCircle, Link2, TrendingUp,
  FileText, ChevronRight, ArrowRight,
} from "lucide-react";
import type { ApiConfig, CaseContent, PrecedentAnalysis, SearchResult } from "../types";
import { findSimilarPrecedents, searchRechtspraak } from "../api";

interface Props {
  caseContent: CaseContent;
  config: ApiConfig;
  onCaseSelect: (ecli: string) => void;
  precedents: PrecedentAnalysis | null;
  onPrecedentsChange: (p: PrecedentAnalysis | null) => void;
}

export default function SimilarPrecedentsPanel({ caseContent, config, onCaseSelect, precedents, onPrecedentsChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFind() {
    setLoading(true);
    setError(null);
    try {
      // Search for candidate cases using the case's subject/keywords
      const searchQuery = caseContent.metadata?.subject || caseContent.metadata?.title || "";
      const searchResults: SearchResult[] = [];
      if (searchQuery) {
        const data = await searchRechtspraak({ query: searchQuery, max: 30 });
        searchResults.push(...data.results);
      }
      // Also try a broader search
      const broadData = await searchRechtspraak({ max: 30 });
      searchResults.push(...broadData.results);

      // Deduplicate
      const seen = new Set<string>();
      const unique = searchResults.filter((r) => {
        if (seen.has(r.ecli) || r.ecli === caseContent.ecli) return false;
        seen.add(r.ecli);
        return true;
      });

      const result = await findSimilarPrecedents(config, caseContent, unique);
      onPrecedentsChange(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find precedents");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Searching for similar precedents...</p>
        <p className="text-xs text-slate-400 mt-1">Fetching candidate cases and analyzing similarities</p>
      </div>
    );
  }

  if (error && !precedents) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={handleFind}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!precedents) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <Link2 className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
        </div>
        <p className="text-base font-medium text-slate-700 mb-1">Find Similar Precedents</p>
        <p className="text-sm text-slate-400 mb-6 max-w-sm">
          AI will search Rechtspraak.nl for related cases and rank them by similarity to this ruling.
        </p>
        <button
          onClick={handleFind}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          Find Precedents
        </button>
      </div>
    );
  }

  const hasRaw = !precedents.similarPrecedents && precedents.rawAnalysis;

  if (hasRaw) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{precedents.rawAnalysis}</p>
        </div>
        <button
          onClick={handleFind}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Regenerate
        </button>
      </div>
    );
  }

  const sorted = [...(precedents.similarPrecedents || [])].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.similarity] ?? 3) - (order[b.similarity] ?? 3);
  });

  return (
    <div className="space-y-4">
      {/* Summary */}
      {precedents.precedentSummary && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Precedent Analysis</span>
          </div>
          <p className="text-sm text-slate-700">{precedents.precedentSummary}</p>
        </div>
      )}

      {/* Precedent cards */}
      {sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border transition-all ${
                p.similarity === "high"
                  ? "border-emerald-200 bg-emerald-50/30"
                  : p.similarity === "medium"
                  ? "border-blue-200 bg-blue-50/30"
                  : "border-slate-200 bg-slate-50/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <button
                      onClick={() => onCaseSelect(p.ecli)}
                      className="text-xs font-mono text-blue-600 font-medium hover:underline"
                    >
                      {p.ecli}
                    </button>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getSimilarityColor(p.similarity)}`}>
                      {p.similarity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-1">{p.title}</p>
                  <p className="text-xs text-slate-500 mb-2">{p.reason}</p>

                  {p.sharedPrinciples?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.sharedPrinciples.map((sp, j) => (
                        <span key={j} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded">
                          {sp}
                        </span>
                      ))}
                    </div>
                  )}

                  {p.keyDifference && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-500"><span className="font-medium">Key difference:</span> {p.keyDifference}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onCaseSelect(p.ecli)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all flex-shrink-0"
                >
                  Open
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="w-8 h-8 text-slate-300 mb-2" strokeWidth={1.5} />
          <p className="text-sm text-slate-400">No similar precedents found</p>
        </div>
      )}

      <button
        onClick={handleFind}
        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        Regenerate Search
      </button>
    </div>
  );
}

function getSimilarityColor(similarity: string): string {
  switch (similarity) {
    case "high": return "bg-emerald-100 text-emerald-700";
    case "medium": return "bg-blue-100 text-blue-700";
    case "low": return "bg-slate-100 text-slate-600";
    default: return "bg-slate-100 text-slate-600";
  }
}

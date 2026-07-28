import { useState, useCallback } from "react";
import {
  Search, Plus, X, Loader2, GitCompare, AlertCircle,
  FileText, Scale, CheckCircle2, XCircle, ArrowRight, Sparkles, Download,
} from "lucide-react";
import type { ApiConfig, CaseComparison, CaseContent } from "../types";
import { searchRechtspraak, getCaseContent, compareCases } from "../api";
import { exportComparisonToPDF } from "../pdfExport";

interface Props {
  config: ApiConfig;
}

interface CaseSlot {
  ecli: string;
  content: CaseContent | null;
  loading: boolean;
  error: string | null;
}

export default function CaseComparisonPanel({ config }: Props) {
  const [slots, setSlots] = useState<CaseSlot[]>([
    { ecli: "", content: null, loading: false, error: null },
    { ecli: "", content: null, loading: false, error: null },
  ]);
  const [comparison, setComparison] = useState<CaseComparison | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ ecli: string; title: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await searchRechtspraak({ query: searchQuery, max: 20 });
      setSearchResults(data.results.map((r) => ({ ecli: r.ecli, title: r.title })));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  const loadCaseIntoSlot = useCallback(async (slotIndex: number, ecli: string) => {
    setSlots((prev) => prev.map((s, i) => i === slotIndex ? { ...s, ecli, loading: true, error: null, content: null } : s));
    try {
      const content = await getCaseContent(ecli);
      setSlots((prev) => prev.map((s, i) => i === slotIndex ? { ...s, content, loading: false } : s));
    } catch (err) {
      setSlots((prev) => prev.map((s, i) => i === slotIndex ? { ...s, loading: false, error: err instanceof Error ? err.message : "Failed to load" } : s));
    }
    setSearchResults([]);
    setSearchQuery("");
    setActiveSlot(null);
  }, []);

  function addSlot() {
    if (slots.length >= 4) return;
    setSlots([...slots, { ecli: "", content: null, loading: false, error: null }]);
  }

  function removeSlot(index: number) {
    if (slots.length <= 2) return;
    setSlots(slots.filter((_, i) => i !== index));
  }

  async function handleCompare() {
    const loaded = slots.filter((s) => s.content);
    if (loaded.length < 2) return;
    setComparing(true);
    setCompareError(null);
    try {
      const result = await compareCases(
        config,
        loaded.map((s) => ({
          ecli: s.content!.ecli,
          text: s.content!.text,
          metadata: s.content!.metadata as Record<string, string>,
        })),
      );
      setComparison(result);
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setComparing(false);
    }
  }

  const loadedCount = slots.filter((s) => s.content).length;
  const canCompare = loadedCount >= 2 && !comparing;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-800">Case Comparison</h3>
          <span className="text-xs text-slate-400">({loadedCount}/{slots.length} loaded)</span>
        </div>
        <div className="flex gap-2">
          {slots.length < 4 && (
            <button
              onClick={addSlot}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Case
            </button>
          )}
          {comparison && !comparing && (
            <button
              onClick={() => {
                const loaded = slots.filter((s) => s.content);
                exportComparisonToPDF({
                  comparison,
                  cases: loaded.map((s) => ({
                    ecli: s.content!.ecli,
                    metadata: s.content!.metadata as Record<string, string>,
                  })),
                  title: `Case Comparison (${loaded.length} cases)`,
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-900 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>
          )}
          <button
            onClick={handleCompare}
            disabled={!canCompare}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {comparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {comparing ? "Comparing..." : "Compare Cases"}
          </button>
        </div>
      </div>

      {/* Case slots */}
      <div className={`grid gap-3 mt-4 ${slots.length === 2 ? "grid-cols-2" : slots.length === 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-4"}`}>
        {slots.map((slot, i) => (
          <div
            key={i}
            className={`relative border-2 rounded-lg p-3 min-h-[120px] ${
              slot.content ? "border-blue-200 bg-blue-50/30" : "border-dashed border-slate-200 bg-slate-50"
            }`}
          >
            {slots.length > 2 && (
              <button
                onClick={() => removeSlot(i)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {slot.loading ? (
              <div className="flex flex-col items-center justify-center h-full py-4">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin mb-2" />
                <p className="text-xs text-slate-400">Loading...</p>
              </div>
            ) : slot.error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                <p className="text-xs text-red-600 mb-2">{slot.error}</p>
                <button
                  onClick={() => setActiveSlot(i)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : slot.content ? (
              <div>
                <div className="flex items-start gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[10px] font-mono text-blue-600 font-medium">{slot.content.ecli}</span>
                </div>
                <p className="text-xs text-slate-700 line-clamp-3">{slot.content.metadata?.title || slot.content.ecli}</p>
                {slot.content.metadata?.creator && (
                  <p className="text-[10px] text-slate-400 mt-1">{slot.content.metadata.creator}</p>
                )}
                {slot.content.metadata?.date && (
                  <p className="text-[10px] text-slate-400">{slot.content.metadata.date}</p>
                )}
                <button
                  onClick={() => { setSlots((prev) => prev.map((s, j) => j === i ? { ...s, ecli: "", content: null } : s)); }}
                  className="mt-2 text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <button
                  onClick={() => setActiveSlot(i)}
                  className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">Add case</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Search modal when slot is active */}
      {activeSlot !== null && (
        <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-600">Find a case for slot {activeSlot + 1}</span>
            <button onClick={() => setActiveSlot(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search or paste ECLI code..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {searchResults.map((r) => (
              <button
                key={r.ecli}
                onClick={() => loadCaseIntoSlot(activeSlot, r.ecli)}
                className="w-full text-left p-2 hover:bg-blue-50 rounded-lg transition-all"
              >
                <span className="text-[10px] font-mono text-blue-600 block">{r.ecli}</span>
                <span className="text-xs text-slate-600 line-clamp-1">{r.title}</span>
              </button>
            ))}
            {searchResults.length === 0 && !searching && searchQuery && (
              <p className="text-xs text-slate-400 text-center py-2">No results. Try a different search.</p>
            )}
          </div>
          {searchQuery.match(/^ECLI:/i) && (
            <button
              onClick={() => loadCaseIntoSlot(activeSlot, searchQuery.trim())}
              className="mt-2 w-full py-2 bg-slate-100 text-slate-700 text-xs rounded-lg hover:bg-slate-200 transition-all"
            >
              Load "{searchQuery}" directly
            </button>
          )}
        </div>
      )}

      {/* Comparison results */}
      {compareError && (
        <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {compareError}
        </div>
      )}

      {comparing && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-sm text-slate-500">AI is comparing cases...</p>
        </div>
      )}

      {comparison && !comparing && (
        <div className="mt-4 flex-1 overflow-y-auto space-y-4">
          {/* Summary */}
          {comparison.comparativeSummary && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Comparative Summary</span>
              </div>
              <p className="text-sm text-slate-700">{comparison.comparativeSummary}</p>
            </div>
          )}

          {/* Common principles */}
          {comparison.commonPrinciples?.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                <Scale className="w-4 h-4 text-emerald-500" />
                Common Principles
              </h4>
              <div className="space-y-1.5">
                {comparison.commonPrinciples.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Convergence / Divergence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {comparison.convergencePoints?.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <h4 className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Convergence
                </h4>
                <ul className="space-y-1">
                  {comparison.convergencePoints.map((c, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {comparison.divergencePoints?.length > 0 && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <h4 className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  Divergence
                </h4>
                <ul className="space-y-1">
                  {comparison.divergencePoints.map((d, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="text-red-500 mt-0.5">•</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Differences table */}
          {comparison.differences?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Key Differences</h4>
              <div className="space-y-2">
                {comparison.differences.map((diff, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-2">{diff.topic}</p>
                    <div className="space-y-1.5">
                      {diff.positions.map((pos, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0">
                            {pos.ecli}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0 mt-1" />
                          <p className="text-xs text-slate-600">{pos.position}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal evolution */}
          {comparison.legalEvolution && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <h4 className="text-xs font-medium text-amber-700 mb-1">Legal Evolution</h4>
              <p className="text-sm text-slate-700">{comparison.legalEvolution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

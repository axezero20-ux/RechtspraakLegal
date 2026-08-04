import { useState, useEffect, useCallback } from "react";
import { Loader2, ArrowRight, AlertCircle, FileText, Pin, PinOff, Lock, X } from "lucide-react";
import type { CaseContent, EcliPin, SubscriptionPlan } from "../types";
import { getCaseContent } from "../api";
import { fetchEcliPins, addEcliPin, deleteEcliPin, fetchSubscription } from "../mattersApi";

interface Props {
  onCaseLoaded: (content: CaseContent) => void;
  onCaseSelected: (ecli: string) => void;
}

export default function EcliPanel({ onCaseLoaded, onCaseSelected }: Props) {
  const [ecli, setEcli] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinnedCases, setPinnedCases] = useState<EcliPin[]>([]);
  const [showPinned, setShowPinned] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription()
      .then((sub) => setPlan(sub?.plan || "free"))
      .catch(() => setPlan("free"));
    loadPinnedCases();
  }, []);

  const loadPinnedCases = useCallback(async () => {
    try {
      const pins = await fetchEcliPins();
      setPinnedCases(pins);
    } catch {
      // ignore
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = ecli.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setPinError(null);
    try {
      const content = await getCaseContent(trimmed);
      // Auto-pin on load
      try {
        await addEcliPin(trimmed, content.metadata?.title || null);
        await loadPinnedCases();
      } catch {
        // pin failure is non-fatal (e.g. already pinned or plan limit)
      }
      onCaseLoaded(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch case");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnpin(ecliCode: string) {
    try {
      await deleteEcliPin(ecliCode);
      setPinnedCases((prev) => prev.filter((c) => c.ecli !== ecliCode));
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Pinned cases toggle bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setShowPinned(!showPinned); if (!showPinned) loadPinnedCases(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showPinned ? "bg-amber-50 border-amber-300 text-amber-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            Pinned ECLI Cases
            {pinnedCases.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full">
                {pinnedCases.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Pinned cases panel */}
      {showPinned && (
        <div className="mb-4 p-4 bg-amber-50/50 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-600">Pinned ECLI cases ({pinnedCases.length})</span>
            <button onClick={() => setShowPinned(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {plan === "free" && (
            <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 bg-amber-100 border border-amber-300 rounded-md text-[11px] text-amber-800">
              <Lock className="w-3 h-3 flex-shrink-0" />
              <span>Free plan allows only 1 pinned ECLI case. Upgrade to Pro for unlimited pins.</span>
            </div>
          )}
          {pinnedCases.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">No pinned ECLI cases yet. Load a case and click Pin to save it here.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {pinnedCases.map((c) => (
                <div key={c.id} className="group flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-all">
                  <button onClick={() => { onCaseSelected(c.ecli); setShowPinned(false); }} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span className="text-[10px] font-mono text-blue-600 font-medium truncate">{c.ecli}</span>
                    </div>
                    <span className="text-xs text-slate-700 block truncate">
                      {c.title || c.ecli}
                    </span>
                  </button>
                  <button
                    onClick={() => handleUnpin(c.ecli)}
                    title="Unpin case"
                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <PinOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ECLI input */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-3">
              <FileText className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Enter ECLI Code</h3>
            <p className="text-sm text-slate-500 mt-1">
              Paste a European Case Law Identifier (ECLI) to load the case directly
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={ecli}
              onChange={(e) => { setEcli(e.target.value); setError(null); setPinError(null); }}
              placeholder="ECLI:NL:..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />

            {error && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {pinError && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !ecli.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading case...
                </>
              ) : (
                <>
                  Load Case
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-500">
              <span className="font-medium">Example:</span> ECLI:NL:PHR:2023:1, ECLI:NL:HR:2022:1234
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

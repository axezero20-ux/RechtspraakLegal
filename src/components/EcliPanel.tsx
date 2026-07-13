import { useState } from "react";
import { Loader2, ArrowRight, AlertCircle, FileText } from "lucide-react";
import type { CaseContent } from "../types";
import { getCaseContent } from "../api";

interface Props {
  onCaseLoaded: (content: CaseContent) => void;
}

export default function EcliPanel({ onCaseLoaded }: Props) {
  const [ecli, setEcli] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ecli.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const content = await getCaseContent(ecli.trim());
      onCaseLoaded(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch case");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
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
            onChange={(e) => { setEcli(e.target.value); setError(null); }}
            placeholder="ECLI:NL:..."
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
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
  );
}

import { useState } from "react";
import { Search, Calendar, Filter, Loader2, FileText, ChevronRight } from "lucide-react";
import type { SearchResult } from "../types";
import { searchRechtspraak } from "../api";

interface Props {
  onCaseSelected: (ecli: string) => void;
}

export default function SearchPanel({ onCaseSelected }: Props) {
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [caseType, setCaseType] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await searchRechtspraak({
        from: fromDate || undefined,
        to: toDate || undefined,
        type: caseType || undefined,
        max: 50,
      });
      setResults(data.results);
      if (data.results.length === 0) {
        setError("No results found. Try adjusting your search criteria.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Rechtspraak.nl..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              showFilters
                ? "bg-blue-50 border-blue-300 text-blue-600"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
              <select
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
                className="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="">All</option>
                <option value="Uitspraak">Uitspraak</option>
                <option value="Conclusie">Conclusie</option>
              </select>
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
        {results.map((result) => (
          <button
            key={result.ecli}
            onClick={() => onCaseSelected(result.ecli)}
            className="group w-full text-left p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs font-mono text-blue-600 font-medium">{result.ecli}</span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">{result.title}</p>
                {result.summary && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{result.summary}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Updated: {new Date(result.updated).toLocaleDateString("nl-NL")}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
            </div>
          </button>
        ))}

        {results.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-12 h-12 text-slate-300 mb-3" strokeWidth={1} />
            <p className="text-sm text-slate-400">Search for Dutch court cases on Rechtspraak.nl</p>
            <p className="text-xs text-slate-400 mt-1">Use filters to narrow by date or type</p>
          </div>
        )}
      </div>
    </div>
  );
}

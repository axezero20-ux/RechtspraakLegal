import { useState, useEffect, useCallback } from "react";
import { Search, Calendar, Loader2, FileText, ChevronRight, SlidersHorizontal, X, Save, Trash2, History } from "lucide-react";
import type { SearchResult, MatterSearch } from "../types";
import { searchRechtspraak } from "../api";
import { fetchMatterSearches, saveMatterSearch, deleteMatterSearch } from "../mattersApi";

interface Props {
  onCaseSelected: (ecli: string) => void;
  matterId?: string;
}

const COURT_OPTIONS = [
  { value: "", label: "All Courts" },
  { value: "HR", label: "Hoge Raad" },
  { value: "GHAMS", label: "Gerechtshof Amsterdam" },
  { value: "GHDHA", label: "Gerechtshof Den Haag" },
  { value: "GHARL", label: "Gerechtshof Arnhem-Leeuwarden" },
  { value: "GHSHE", label: "Gerechtshof 's-Hertogenbosch" },
  { value: "RBAMS", label: "Rechtbank Amsterdam" },
  { value: "RBDHA", label: "Rechtbank Den Haag" },
  { value: "RBROT", label: "Rechtbank Rotterdam" },
  { value: "RBMNE", label: "Rechtbank Midden-Nederland" },
  { value: "RBLIM", label: "Rechtbank Limburg" },
  { value: "RBGEL", label: "Rechtbank Gelderland" },
  { value: "RBOVE", label: "Rechtbank Overijssel" },
  { value: "RBNHO", label: "Rechtbank Noord-Holland" },
  { value: "RBNNE", label: "Rechtbank Noord-Nederland" },
  { value: "RVS", label: "Raad van State" },
  { value: "CRVB", label: "Centrale Raad van Beroep" },
  { value: "CBB", label: "College van Beroep voor het bedrijfsleven" },
];

const SUBJECT_OPTIONS = [
  { value: "", label: "All Subjects" },
  { value: "Civiel", label: "Civiel / Civil" },
  { value: "Strafrecht", label: "Strafrecht / Criminal" },
  { value: "Bestuursrecht", label: "Bestuursrecht / Administrative" },
  { value: "Arbeidsrecht", label: "Arbeidsrecht / Labor" },
  { value: "Familierecht", label: "Familierecht / Family" },
  { value: "Insolventierecht", label: "Insolventierecht" },
  { value: "Belastingrecht", label: "Belastingrecht / Tax" },
  { value: "Sociale zekerheid", label: "Sociale zekerheid" },
  { value: "Vreemdelingenrecht", label: "Vreemdelingenrecht" },
];

export default function SearchPanel({ onCaseSelected, matterId }: Props) {
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [caseType, setCaseType] = useState("");
  const [court, setCourt] = useState("");
  const [subject, setSubject] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [savedSearches, setSavedSearches] = useState<MatterSearch[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateFilterCount() {
    let count = 0;
    if (fromDate) count++;
    if (toDate) count++;
    if (caseType) count++;
    if (court) count++;
    if (subject) count++;
    setActiveFilterCount(count);
  }

  const loadSavedSearches = useCallback(async () => {
    if (!matterId) return;
    try {
      const searches = await fetchMatterSearches(matterId);
      setSavedSearches(searches);
    } catch {
      // ignore
    }
  }, [matterId]);

  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await searchRechtspraak({
        query: query || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        type: caseType || undefined,
        court: court || undefined,
        subject: subject || undefined,
        max: 50,
      });
      setResults(data.results);
      if (data.results.length === 0) {
        setError("No results found with the current filters. The API returned results but none matched your court/date/subject criteria. Try broadening your filters.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSearch() {
    if (!matterId || results.length === 0) return;
    setSaving(true);
    try {
      const filters: Record<string, unknown> = {};
      if (fromDate) filters.from = fromDate;
      if (toDate) filters.to = toDate;
      if (caseType) filters.type = caseType;
      if (court) filters.court = court;
      if (subject) filters.subject = subject;
      await saveMatterSearch(matterId, query || null, Object.keys(filters).length > 0 ? filters : null, results);
      await loadSavedSearches();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSearch(id: string) {
    try {
      await deleteMatterSearch(id);
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    }
  }

  function loadSavedSearch(search: MatterSearch) {
    setResults(search.results);
    setQuery(search.query || "");
    setShowHistory(false);
  }

  function clearFilters() {
    setFromDate("");
    setToDate("");
    setCaseType("");
    setCourt("");
    setSubject("");
    setActiveFilterCount(0);
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
            className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? "bg-blue-50 border-blue-300 text-blue-600"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
          {matterId && (
            <>
              <button
                type="button"
                onClick={handleSaveSearch}
                disabled={saving || results.length === 0}
                title="Save search results"
                className="flex items-center justify-center px-3 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                title="Search history"
                className={`flex items-center justify-center px-3 py-2.5 rounded-lg border text-sm transition-all ${
                  showHistory ? "bg-blue-50 border-blue-300 text-blue-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <History className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {showFilters && (
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            {/* Date range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => { setFromDate(e.target.value); updateFilterCount(); }}
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
                    onChange={(e) => { setToDate(e.target.value); updateFilterCount(); }}
                    className="w-full pl-8 pr-2 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Type, Court, Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Case Type</label>
                <select
                  value={caseType}
                  onChange={(e) => { setCaseType(e.target.value); updateFilterCount(); }}
                  className="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  <option value="">All</option>
                  <option value="Uitspraak">Uitspraak (Judgment)</option>
                  <option value="Conclusie">Conclusie (Conclusion)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Court</label>
                <select
                  value={court}
                  onChange={(e) => { setCourt(e.target.value); updateFilterCount(); }}
                  className="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {COURT_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Subject Area</label>
                <select
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); updateFilterCount(); }}
                  className="w-full px-2 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </form>

      {error && (
        <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* Saved searches */}
      {showHistory && matterId && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-600">Saved searches ({savedSearches.length})</span>
            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {savedSearches.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">No saved searches yet. Run a search and click Save.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {savedSearches.map((s) => (
                <div key={s.id} className="group flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-all">
                  <button onClick={() => loadSavedSearch(s)} className="flex-1 text-left min-w-0">
                    <span className="text-xs font-medium text-slate-700 block truncate">
                      {s.query || "(no query)"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {s.results.length} results · {new Date(s.created_at).toLocaleDateString("nl-NL")}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteSearch(s.id)}
                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
            <p className="text-xs text-slate-400 mt-1">Use filters to narrow by date, court, subject, or type</p>
          </div>
        )}
      </div>
    </div>
  );
}

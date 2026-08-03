import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Plus, FileText,
  Trash2, Loader2, X, AlertCircle, Scale, Search,
  GitCompare, Upload,
} from "lucide-react";
import type { ApiConfig, Matter, MatterItem, SearchResult, CaseContent } from "../types";
import { fetchMatterItems, addMatterItem, deleteMatterItem } from "../mattersApi";
import { searchRechtspraak, getCaseContent } from "../api";
import SearchPanel from "./SearchPanel";
import EcliPanel from "./EcliPanel";
import CaseComparisonPanel from "./CaseComparisonPanel";
import PdfUploadPanel from "./PdfUploadPanel";

interface Props {
  matter: Matter;
  config: ApiConfig;
  onBack: () => void;
  onCaseSelect: (ecli: string) => void;
  onCaseLoaded: (content: CaseContent) => void;
}

type Tab = "search" | "ecli" | "compare" | "upload" | "cases";

export default function MatterWorkspace({ matter, config, onBack, onCaseSelect, onCaseLoaded }: Props) {
  const [tab, setTab] = useState<Tab>("search");
  const [items, setItems] = useState<MatterItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMatterItems(matter.id);
      setItems(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [matter.id]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const caseItems = items.filter((i) => i.type === "case");

  const tabs: { id: Tab; label: string; icon: typeof FileText; count?: number }[] = [
    { id: "search", label: "Search", icon: Search },
    { id: "ecli", label: "ECLI Code", icon: FileText },
    { id: "compare", label: "Compare", icon: GitCompare },
    { id: "upload", label: "Upload", icon: Upload },
    { id: "cases", label: "Cases", icon: FileText, count: caseItems.length },
  ];

  async function handleDeleteItem(id: string) {
    try {
      await deleteMatterItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to matters
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-800 truncate">{matter.title}</h2>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            {matter.client_ref && <span>Client: {matter.client_ref}</span>}
            {matter.jurisdiction && <span>Jurisdiction: {matter.jurisdiction}</span>}
            <span>Created: {new Date(matter.created_at).toLocaleDateString("nl-NL")}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-3 border-b border-slate-200 flex-shrink-0 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              tab === t.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden mt-3">
        {tab === "search" && <SearchPanel onCaseSelected={onCaseSelect} matterId={matter.id} />}
        {tab === "ecli" && <EcliPanel onCaseLoaded={onCaseLoaded} />}
        {tab === "compare" && <CaseComparisonPanel config={config} matterId={matter.id} />}
        {tab === "upload" && <PdfUploadPanel config={config} matterId={matter.id} />}
        {tab === "cases" && (
          <CasesTab matterId={matter.id} items={caseItems} loading={loading} onAdd={loadItems} onDelete={handleDeleteItem} onCaseSelect={onCaseSelect} />
        )}
      </div>
    </div>
  );
}

// ── Cases Tab ──────────────────────────────────────────────────────────────────

function CasesTab({ matterId, items, loading, onAdd, onDelete, onCaseSelect }: {
  matterId: string;
  items: MatterItem[];
  loading: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onCaseSelect: (ecli: string) => void;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const data = await searchRechtspraak({ query: searchQuery, max: 20 });
      setSearchResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleAddCase(ecli: string, title: string) {
    setAdding(true);
    setError(null);
    try {
      await addMatterItem(matterId, { type: "case", ecli, content: { title } });
      onAdd();
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add case");
    } finally {
      setAdding(false);
    }
  }

  async function handleAddByEcli() {
    const ecli = searchQuery.trim();
    if (!ecli.match(/^ECLI:/i)) return;
    setAdding(true);
    setError(null);
    try {
      const content = await getCaseContent(ecli);
      await addMatterItem(matterId, { type: "case", ecli, content: { title: content.metadata?.title || ecli } });
      onAdd();
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">Pinned cases for this matter</p>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Case
        </button>
      </div>

      {showSearch && (
        <div className="mb-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (searchQuery.match(/^ECLI:/i) ? handleAddByEcli() : handleSearch())}
                placeholder="Search cases or paste ECLI:NL:..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                autoFocus
              />
            </div>
            <button onClick={handleSearch} disabled={searching} className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900 disabled:opacity-50">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
            <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }} className="p-2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {searchQuery.match(/^ECLI:/i) && (
            <button onClick={handleAddByEcli} disabled={adding} className="w-full py-2 bg-blue-50 text-blue-700 text-xs rounded-lg hover:bg-blue-100 transition-all mb-2">
              {adding ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Load "${searchQuery}" directly`}
            </button>
          )}
          {error && <div className="flex items-center gap-2 text-xs text-red-600 mb-2"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {searchResults.map((r) => (
              <button
                key={r.ecli}
                onClick={() => handleAddCase(r.ecli, r.title)}
                disabled={adding}
                className="w-full text-left p-2 hover:bg-white rounded-lg transition-all"
              >
                <span className="text-[10px] font-mono text-blue-600 block">{r.ecli}</span>
                <span className="text-xs text-slate-600 line-clamp-1">{r.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mb-2" strokeWidth={1} />
            <p className="text-sm text-slate-400">No cases pinned yet. Click "Add Case" to search and pin cases by ECLI.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="group flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-all">
              <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-blue-600 font-medium block">{item.ecli}</span>
                <p className="text-sm text-slate-700 line-clamp-2">{(item.content as Record<string, unknown>)?.title as string || item.ecli}</p>
                <button
                  onClick={() => onCaseSelect(item.ecli!)}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  Open case viewer
                </button>
              </div>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

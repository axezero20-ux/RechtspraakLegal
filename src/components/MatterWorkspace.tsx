import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, FileText, Scale, Search,
  GitCompare, Upload,
} from "lucide-react";
import type { ApiConfig, Matter, CaseContent } from "../types";
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

type Tab = "search" | "ecli" | "compare" | "upload";

export default function MatterWorkspace({ matter, config, onBack, onCaseSelect, onCaseLoaded }: Props) {
  const [tab, setTab] = useState<Tab>("search");

  const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: "search", label: "Search", icon: Search },
    { id: "ecli", label: "ECLI Code", icon: FileText },
    { id: "compare", label: "Compare", icon: GitCompare },
    { id: "upload", label: "Upload", icon: Upload },
  ];

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
      <div className="flex-1 min-h-0 overflow-y-auto mt-3">
        {tab === "search" && <SearchPanel onCaseSelected={onCaseSelect} matterId={matter.id} />}
        {tab === "ecli" && <EcliPanel onCaseLoaded={onCaseLoaded} />}
        {tab === "compare" && <CaseComparisonPanel config={config} matterId={matter.id} />}
        {tab === "upload" && <PdfUploadPanel config={config} matterId={matter.id} />}
      </div>
    </div>
  );
}

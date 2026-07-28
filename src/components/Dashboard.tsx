import { useState } from "react";
import {
  Scale, Search, FileText, Upload, Settings, Sparkles, GitCompare,
} from "lucide-react";
import type { ApiConfig, CaseContent } from "../types";
import SearchPanel from "./SearchPanel";
import EcliPanel from "./EcliPanel";
import PdfUploadPanel from "./PdfUploadPanel";
import CaseViewer from "./CaseViewer";
import CaseComparisonPanel from "./CaseComparisonPanel";

type View = "search" | "ecli" | "upload" | "compare";
type Screen = "main" | "case";

interface Props {
  config: ApiConfig;
  onSettings: () => void;
}

export default function Dashboard({ config, onSettings }: Props) {
  const [view, setView] = useState<View>("search");
  const [screen, setScreen] = useState<Screen>("main");
  const [selectedEcli, setSelectedEcli] = useState<string | null>(null);

  function handleCaseSelected(ecli: string) {
    setSelectedEcli(ecli);
    setScreen("case");
  }

  function handleCaseLoaded(content: CaseContent) {
    setSelectedEcli(content.ecli);
    setScreen("case");
  }

  function handleBack() {
    setScreen("main");
    setSelectedEcli(null);
  }

  const navItems = [
    { id: "search" as View, label: "Search", icon: Search },
    { id: "ecli" as View, label: "ECLI Code", icon: FileText },
    { id: "compare" as View, label: "Compare Cases", icon: GitCompare },
    { id: "upload" as View, label: "Upload Document", icon: Upload },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Rechtspraak AI</h1>
            <p className="text-xs text-slate-400">Dutch Legal Research Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-slate-600">
              {config.provider === "claude" ? "Claude API" : "OpenRouter"}
            </span>
          </div>
          <button
            onClick={onSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      {screen === "case" && selectedEcli ? (
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
            <CaseViewer ecli={selectedEcli} config={config} onBack={handleBack} onCaseSelect={handleCaseSelected} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <nav className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  view === item.id
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Content area */}
          <div className="flex-1 p-6 overflow-hidden">
            <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
              {view === "search" && <SearchPanel onCaseSelected={handleCaseSelected} />}
              {view === "ecli" && <EcliPanel onCaseLoaded={handleCaseLoaded} />}
              {view === "compare" && <CaseComparisonPanel config={config} />}
              {view === "upload" && <PdfUploadPanel config={config} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

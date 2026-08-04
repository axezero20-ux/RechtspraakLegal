import { useState } from "react";
import {
  Scale, Settings, Sparkles, LogOut, FolderOpen, HelpCircle, X,
} from "lucide-react";
import type { ApiConfig, CaseContent, Matter } from "../types";
import CaseViewer from "./CaseViewer";
import MattersSidebar from "./MattersSidebar";
import MatterWorkspace from "./MatterWorkspace";
import HelpPanel from "./HelpPanel";
import { useAuth } from "../context/AuthContext";

type Screen = "main" | "case";

interface Props {
  config: ApiConfig;
  onSettings: () => void;
}

export default function Dashboard({ config, onSettings }: Props) {
  const { profile, signOut } = useAuth();
  const [screen, setScreen] = useState<Screen>("main");
  const [selectedEcli, setSelectedEcli] = useState<string | null>(null);
  const [activeMatter, setActiveMatter] = useState<Matter | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  function handleCaseSelected(ecli: string) {
    setSelectedEcli(ecli);
    setScreen("case");
  }

  function handleCaseLoaded(content: CaseContent) {
    setSelectedEcli(content.ecli);
    setScreen("case");
  }

  function handleBackToMain() {
    setScreen("main");
    setSelectedEcli(null);
  }

  function handleSelectMatter(matter: Matter | null) {
    setActiveMatter(matter);
    setScreen("main");
    setSelectedEcli(null);
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
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
          {profile && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {profile.first_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-xs text-slate-600 font-medium">
                {profile.first_name} {profile.last_name}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-slate-600">
              {config.provider === "claude" ? "Claude API" : "OpenRouter"}
            </span>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Help</span>
          </button>
          <button
            onClick={onSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-medium">Settings</span>
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-medium">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <MattersSidebar activeMatterId={activeMatter?.id || null} onSelectMatter={handleSelectMatter} />

        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
            {screen === "case" && selectedEcli ? (
              <CaseViewer ecli={selectedEcli} config={config} onBack={handleBackToMain} onCaseSelect={handleCaseSelected} />
            ) : activeMatter ? (
              <MatterWorkspace
                matter={activeMatter}
                config={config}
                onBack={handleBackToMain}
                onCaseSelect={handleCaseSelected}
                onCaseLoaded={handleCaseLoaded}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-blue-400" strokeWidth={1.2} />
                </div>
                <h2 className="text-lg font-semibold text-slate-700 mb-2">Select a matter to begin</h2>
                <p className="text-sm text-slate-400 max-w-md">
                  Create a new matter from the sidebar, or select an existing one. All your legal research tools — search, ECLI lookup, case comparison, document upload, notes, and AI chat — live inside each matter.
                </p>
                <div className="flex flex-wrap gap-6 mt-8 justify-center max-w-lg">
                  {[
                    { icon: "Search", label: "Search cases" },
                    { icon: "ECLI", label: "Load by ECLI" },
                    { icon: "Compare", label: "Compare cases" },
                    { icon: "Upload", label: "Upload documents" },
                    { icon: "Notes", label: "Pin notes" },
                    { icon: "Chat", label: "AI chat per matter" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col items-center gap-1.5 text-slate-500">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-600">{f.icon}</span>
                      </div>
                      <span className="text-xs">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl h-[80vh] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <HelpPanel />
          </div>
        </div>
      )}
    </div>
  );
}

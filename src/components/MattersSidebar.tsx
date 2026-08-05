import { useState, useEffect, useRef } from "react";
import {
  Plus, FolderOpen, Archive, MoreVertical, Pencil, Trash2,
  ArchiveRestore, Loader2, X, Check, AlertCircle, Sparkles,
} from "lucide-react";
import type { Matter } from "../types";
import { fetchMatters, createMatter, renameMatter, archiveMatter, unarchiveMatter, deleteMatter, checkMatterLimit } from "../mattersApi";

interface Props {
  activeMatterId: string | null;
  onSelectMatter: (matter: Matter) => void;
}

export default function MattersSidebar({ activeMatterId, onSelectMatter }: Props) {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ plan: string; activeCount: number; limit: number } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const newMatterInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadMatters();
  }, []);

  useEffect(() => {
    if (creating) newMatterInputRef.current?.focus();
  }, [creating]);

  async function loadMatters() {
    setLoading(true);
    try {
      const [ms, limit] = await Promise.all([fetchMatters(), checkMatterLimit().catch(() => null)]);
      setMatters(ms);
      if (limit) setLimitInfo({ plan: limit.plan, activeCount: limit.activeCount, limit: limit.limit });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matters");
    } finally {
      setLoading(false);
    }
  }

  const activeMatters = matters.filter((m) => m.status === "active");
  const archivedMatters = matters.filter((m) => m.status === "archived");
  const visibleMatters = showArchived ? [...activeMatters, ...archivedMatters] : activeMatters;

  async function handleCreate() {
    const title = newTitle.trim();
    if (!title) return;

    const limit = await checkMatterLimit().catch(() => null);
    if (limit && !limit.allowed) {
      setLimitInfo({ plan: limit.plan, activeCount: limit.activeCount, limit: limit.limit });
      setShowUpgrade(true);
      setNewTitle("");
      setCreating(false);
      return;
    }

    try {
      const matter = await createMatter(title);
      setMatters((prev) => [matter, ...prev]);
      setNewTitle("");
      setCreating(false);
      onSelectMatter(matter);
      loadMatters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create matter");
    }
  }

  async function handleRename(id: string) {
    const title = renameValue.trim();
    if (!title) {
      setRenamingId(null);
      return;
    }
    try {
      await renameMatter(id, title);
      setMatters((prev) => prev.map((m) => (m.id === id ? { ...m, title } : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setRenamingId(null);
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveMatter(id);
      setMatters((prev) => prev.map((m) => (m.id === id ? { ...m, status: "archived" as const } : m)));
      if (activeMatterId === id) onSelectMatter(matters.find((m) => m.id !== id && m.status === "active") || null as unknown as Matter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive");
    }
  }

  async function handleUnarchive(id: string) {
    try {
      await unarchiveMatter(id);
      setMatters((prev) => prev.map((m) => (m.id === id ? { ...m, status: "active" as const } : m)));
      loadMatters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unarchive");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMatter(id);
      setMatters((prev) => prev.filter((m) => m.id !== id));
      if (activeMatterId === id) onSelectMatter(null as unknown as Matter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="w-64 bg-slate-900 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-800">
        <img src="/logo.png" alt="Antilles Legal" className="w-7 h-7 rounded-lg object-contain" />
        <span className="text-sm font-semibold text-white">Matters</span>
      </div>

      {/* New Matter button */}
      <div className="p-3">
        {creating ? (
          <div className="flex gap-1">
            <input
              ref={newMatterInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setCreating(false); setNewTitle(""); }
              }}
              placeholder="Matter title..."
              className="flex-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button onClick={handleCreate} className="p-1.5 text-emerald-400 hover:bg-slate-800 rounded">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setCreating(false); setNewTitle(""); }} className="p-1.5 text-slate-400 hover:bg-slate-800 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            New Matter
          </button>
        )}
      </div>

      {/* Limit indicator */}
      {limitInfo && limitInfo.plan === "free" && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Sparkles className="w-3 h-3" />
            <span>{limitInfo.activeCount}/{limitInfo.limit} active matters (Free)</span>
          </div>
        </div>
      )}

      {/* Matters list */}
      <div className="flex-1 overflow-y-auto px-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        ) : visibleMatters.length === 0 ? (
          <div className="text-center py-8 px-4">
            <FolderOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" strokeWidth={1} />
            <p className="text-xs text-slate-500">
              {showArchived ? "No archived matters" : "No matters yet. Create one to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {visibleMatters.map((matter) => (
              <div key={matter.id} className="relative group">
                {renamingId === matter.id ? (
                  <div className="flex gap-1 px-1 py-1">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(matter.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button onClick={() => handleRename(matter.id)} className="p-1 text-emerald-400 hover:bg-slate-800 rounded">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onSelectMatter(matter)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeMatterId === matter.id
                          ? "bg-slate-800 text-white"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      } ${matter.status === "archived" ? "opacity-50" : ""}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        matter.status === "active" ? "bg-blue-400" : "bg-slate-600"
                      }`} />
                      <span className="flex-1 text-left truncate">{matter.title}</span>
                      {matter.status === "archived" && (
                        <Archive className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === matter.id ? null : matter.id);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {menuOpenId === matter.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                        <div className="absolute right-1 top-9 z-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[140px]">
                          <button
                            onClick={() => {
                              setRenamingId(matter.id);
                              setRenameValue(matter.title);
                              setMenuOpenId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                          >
                            <Pencil className="w-3 h-3" /> Rename
                          </button>
                          {matter.status === "active" ? (
                            <button
                              onClick={() => { handleArchive(matter.id); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              <Archive className="w-3 h-3" /> Archive
                            </button>
                          ) : (
                            <button
                              onClick={() => { handleUnarchive(matter.id); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              <ArchiveRestore className="w-3 h-3" /> Unarchive
                            </button>
                          )}
                          <button
                            onClick={() => { setConfirmDeleteId(matter.id); setMenuOpenId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-slate-700 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Show archived toggle */}
      {archivedMatters.length > 0 && (
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            {showArchived ? "Hide archived" : `Show archived (${archivedMatters.length})`}
          </button>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 px-3 py-2 bg-red-900/90 border border-red-700 rounded-lg text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">Delete matter?</h3>
              <button onClick={() => setConfirmDeleteId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-slate-600">
                This permanently deletes the matter and all its items and chat history. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null); }} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade prompt */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-semibold text-slate-800">Upgrade to Pro</h3>
              </div>
              <button onClick={() => setShowUpgrade(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-6">
              <p className="text-sm text-slate-600 mb-4">
                You've reached the Free plan limit of {limitInfo?.limit ?? 1} active matter{limitInfo?.limit === 1 ? "" : "s"}.
                Upgrade to Pro for unlimited matters, unlimited chat history, and priority AI analysis.
              </p>
              <div className="space-y-2 mb-4">
                {["Unlimited active matters", "Unlimited AI chat per matter", "Priority analysis & summarization", "Pin cases, articles & notes"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowUpgrade(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                Maybe later
              </button>
              <button className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-emerald-700 transition-all">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

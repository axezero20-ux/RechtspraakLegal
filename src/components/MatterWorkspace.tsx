import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Plus, FileText, BookOpen, StickyNote, MessageSquare,
  Trash2, Loader2, Send, X, AlertCircle, Scale, Sparkles, Search,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ApiConfig, Matter, MatterItem, ChatMessage, SearchResult } from "../types";
import {
  fetchMatterItems, addMatterItem, deleteMatterItem,
  fetchMatterChat, saveMatterChat, clearMatterChat,
} from "../mattersApi";
import { searchRechtspraak, getCaseContent, flexibleChat } from "../api";

interface Props {
  matter: Matter;
  config: ApiConfig;
  onBack: () => void;
  onCaseSelect: (ecli: string) => void;
}

type Tab = "cases" | "articles" | "notes" | "chat";

export default function MatterWorkspace({ matter, config, onBack, onCaseSelect }: Props) {
  const [tab, setTab] = useState<Tab>("cases");
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
  const articleItems = items.filter((i) => i.type === "article");
  const noteItems = items.filter((i) => i.type === "note");

  const tabs = [
    { id: "cases" as Tab, label: "Cases", icon: FileText, count: caseItems.length },
    { id: "articles" as Tab, label: "Articles", icon: BookOpen, count: articleItems.length },
    { id: "notes" as Tab, label: "Notes", icon: StickyNote, count: noteItems.length },
    { id: "chat" as Tab, label: "Chat", icon: MessageSquare },
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
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
      <div className="flex gap-1 mt-3 border-b border-slate-200">
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
        {tab === "cases" && (
          <CasesTab matterId={matter.id} items={caseItems} loading={loading} onAdd={loadItems} onDelete={handleDeleteItem} onCaseSelect={onCaseSelect} />
        )}
        {tab === "articles" && (
          <ArticlesTab matterId={matter.id} items={articleItems} loading={loading} onAdd={loadItems} onDelete={handleDeleteItem} />
        )}
        {tab === "notes" && (
          <NotesTab matterId={matter.id} items={noteItems} loading={loading} onAdd={loadItems} onDelete={handleDeleteItem} />
        )}
        {tab === "chat" && (
          <ChatTab matterId={matter.id} config={config} />
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

// ── Articles Tab ───────────────────────────────────────────────────────────────

function ArticlesTab({ matterId, items, loading, onAdd, onDelete }: {
  matterId: string;
  items: MatterItem[];
  loading: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [articleCode, setArticleCode] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleText, setArticleText] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!articleCode.trim() || !articleTitle.trim()) return;
    setAdding(true);
    try {
      await addMatterItem(matterId, {
        type: "article",
        article_code: articleCode.trim(),
        content: { title: articleTitle.trim(), text: articleText.trim() },
      });
      onAdd();
      setArticleCode("");
      setArticleTitle("");
      setArticleText("");
      setShowAdd(false);
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">Pinned law articles for this matter</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Article
        </button>
      </div>

      {showAdd && (
        <div className="mb-3 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <input
            type="text"
            value={articleCode}
            onChange={(e) => setArticleCode(e.target.value)}
            placeholder="Article code (e.g. Art. 6:162 BW)"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            autoFocus
          />
          <input
            type="text"
            value={articleTitle}
            onChange={(e) => setArticleTitle(e.target.value)}
            placeholder="Article title"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <textarea
            value={articleText}
            onChange={(e) => setArticleText(e.target.value)}
            placeholder="Article text or notes..."
            rows={3}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding || !articleCode.trim() || !articleTitle.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Article"}
            </button>
            <button onClick={() => { setShowAdd(false); setArticleCode(""); setArticleTitle(""); setArticleText(""); }} className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mb-2" strokeWidth={1} />
            <p className="text-sm text-slate-400">No articles pinned yet. Add relevant law articles for this matter.</p>
          </div>
        ) : (
          items.map((item) => {
            const content = item.content as Record<string, unknown> | null;
            return (
              <div key={item.id} className="group p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs font-mono text-emerald-600 font-medium">{item.article_code}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700">{content?.title as string || ""}</p>
                    {content?.text && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-3">{content.text as string}</p>
                    )}
                  </div>
                  <button onClick={() => onDelete(item.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Notes Tab ──────────────────────────────────────────────────────────────────

function NotesTab({ matterId, items, loading, onAdd, onDelete }: {
  matterId: string;
  items: MatterItem[];
  loading: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!noteText.trim()) return;
    setAdding(true);
    try {
      await addMatterItem(matterId, { type: "note", content: { text: noteText.trim() } });
      onAdd();
      setNoteText("");
      setShowAdd(false);
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">Free-text notes for this matter</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Note
        </button>
      </div>

      {showAdd && (
        <div className="mb-3 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write your note..."
            rows={4}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding || !noteText.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Note"}
            </button>
            <button onClick={() => { setShowAdd(false); setNoteText(""); }} className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <StickyNote className="w-10 h-10 text-slate-300 mb-2" strokeWidth={1} />
            <p className="text-sm text-slate-400">No notes yet. Add free-text notes about this matter.</p>
          </div>
        ) : (
          items.map((item) => {
            const content = item.content as Record<string, unknown> | null;
            return (
              <div key={item.id} className="group p-3 bg-amber-50/50 border border-amber-200 rounded-lg hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StickyNote className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleString("nl-NL")}</span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{content?.text as string || ""}</p>
                  </div>
                  <button onClick={() => onDelete(item.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Chat Tab ───────────────────────────────────────────────────────────────────

function ChatTab({ matterId, config }: { matterId: string; config: ApiConfig }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function loadChat() {
      try {
        const chat = await fetchMatterChat(matterId);
        if (chat?.messages) setMessages(chat.messages);
      } catch {
        // ignore
      } finally {
        setLoading(false);
        loadedRef.current = true;
      }
    }
    loadChat();
  }, [matterId]);

  // Debounced save: persist chat whenever messages change (after initial load)
  useEffect(() => {
    if (!loadedRef.current) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await saveMatterChat(matterId, messages);
      } catch {
        // ignore
      } finally {
        setSaving(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [messages, matterId]);

  async function handleSend() {
    if (!input.trim() || chatLoading) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setChatLoading(true);
    try {
      const { response, fetchedECLIs } = await flexibleChat(config, [...messages, userMessage]);
      let display = response;
      if (fetchedECLIs.length > 0) {
        display = `*Fetched and analyzed ${fetchedECLIs.length} referenced case${fetchedECLIs.length > 1 ? "s" : ""}: ${fetchedECLIs.join(", ")}*\n\n${response}`;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: display, timestamp: Date.now() }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "AI request failed"}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleClear() {
    try {
      await clearMatterChat(matterId);
      setMessages([]);
    } catch {
      // ignore
    } finally {
      setShowClearConfirm(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 mb-2" strokeWidth={1} />
            <p className="text-sm text-slate-400">Ask anything about this matter — case analysis, legal questions, strategy notes.</p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center max-w-lg">
              {[
                "Summarize this matter",
                "What are the key legal issues?",
                "Suggest a legal strategy",
                "What evidence do I need?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-full hover:bg-slate-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
              msg.role === "user"
                ? "bg-blue-600 text-white rounded-br-md"
                : "bg-slate-100 text-slate-700 rounded-bl-md"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md">
              <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-200">
        {saving && <span className="text-[10px] text-slate-400 self-center mr-1">Saving...</span>}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about this matter..."
          disabled={chatLoading}
          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all disabled:opacity-50"
        />
        {messages.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={chatLoading}
            title="Clear conversation"
            className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={chatLoading || !input.trim()}
          className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">Clear conversation?</h3>
              <button onClick={() => setShowClearConfirm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-slate-600">This permanently deletes all chat history for this matter. This cannot be undone.</p>
            </div>
            <div className="flex gap-3 px-5 py-4 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                No, keep it
              </button>
              <button onClick={handleClear} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Yes, clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

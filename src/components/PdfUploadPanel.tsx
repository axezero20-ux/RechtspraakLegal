import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload, FileText, AlertCircle, Loader2, Download, Send, MessageSquare, Sparkles, FileUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ApiConfig, ChatMessage } from "../types";
import { flexibleChat } from "../api";
import { exportToPDF } from "../pdfExport";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

interface Props {
  config: ApiConfig;
}

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  text: string;
}

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.txt,.md,.rtf";
const MAX_CHARS = 80000;

function getFileKind(file: File): "pdf" | "docx" | "text" | "unknown" {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (name.endsWith(".doc") || file.type === "application/msword") return "docx";
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".rtf") || file.type.startsWith("text/")) return "text";
  return "unknown";
}

async function extractText(file: File): Promise<string> {
  const kind = getFileKind(file);

  if (kind === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? (item as { str: string }).str : ""))
        .join(" ");
      text += pageText + "\n\n";
    }
    return text;
  }

  if (kind === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await import("mammoth/mammoth.browser");
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (kind === "text") {
    return await file.text();
  }

  throw new Error("Unsupported file type. Please upload a PDF, Word document, or text file.");
}

export default function PdfUploadPanel({ config }: Props) {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFile = useCallback(async (rawFile: File) => {
    const kind = getFileKind(rawFile);
    if (kind === "unknown") {
      setError("Unsupported file type. Please upload a PDF, Word document (.docx, .doc), or text file (.txt, .md, .rtf).");
      return;
    }
    setLoading(true);
    setError(null);
    setFile(null);
    setMessages([]);
    setSummary(null);

    try {
      const text = await extractText(rawFile);
      if (!text.trim()) {
        throw new Error("Could not extract any text from this file. It may be empty or scanned.");
      }
      const truncated = text.length > MAX_CHARS ? text.substring(0, MAX_CHARS) + "\n\n[... truncated]" : text;
      setFile({ name: rawFile.name, type: kind, size: rawFile.size, text: truncated });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleSend() {
    if (!input.trim() || !file || chatLoading) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setChatLoading(true);
    try {
      const { response, fetchedECLIs } = await flexibleChat(
        config,
        [...messages, userMessage],
        { ecli: file.name, text: file.text },
      );
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

  async function handleSummarize() {
    if (!file || summarizing) return;
    setSummarizing(true);
    try {
      const { response: result } = await flexibleChat(
        config,
        [{ role: "user", content: `Please provide a comprehensive summary of the following document:\n\n${file.text}\n\nStructure your summary with: 1. Document Overview 2. Key Points 3. Legal Issues 4. Conclusions`, timestamp: Date.now() }],
        { ecli: file.name, text: file.text },
      );
      setSummary(result);
    } catch {
      setSummary(null);
    } finally {
      setSummarizing(false);
    }
  }

  function handleExport() {
    exportToPDF({
      title: file?.name || "Uploaded Document",
      summary: summary || undefined,
      messages: messages.length > 0 ? messages : undefined,
    });
  }

  function handleReset() {
    setFile(null);
    setMessages([]);
    setSummary(null);
    setError(null);
  }

  // ── File loaded view ──
  if (file && !loading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-sm font-medium text-slate-700 truncate block max-w-xs">{file.name}</span>
              <span className="text-xs text-slate-400">
                {(file.size / 1024).toFixed(0)} KB · {file.text.length.toLocaleString()} chars extracted
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-all"
            >
              Upload New
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          {messages.length === 0 && !summary && !summarizing && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-3" strokeWidth={1} />
              <p className="text-sm font-medium text-slate-600 mb-1">Ask anything about this document</p>
              <p className="text-xs text-slate-400 mb-6 max-w-sm">
                Type a question or command below, or generate an AI summary to get started.
              </p>
              <button
                onClick={handleSummarize}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Generate AI Summary
              </button>
              <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-lg">
                {[
                  "Summarize this document",
                  "What are the key points?",
                  "Extract all important dates",
                  "List the main legal arguments",
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

          {summarizing && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500">AI is analyzing your document...</p>
            </div>
          )}

          {summary && !summarizing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-slate-700">AI Summary</span>
                </div>
                <button
                  onClick={handleSummarize}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Regenerate
                </button>
              </div>
              <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-700 rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
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

        {/* Input */}
        <div className="flex gap-2 pt-3 border-t border-slate-200">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question or give a command about this document..."
            disabled={chatLoading}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={chatLoading || !input.trim()}
            className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Upload view ──
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 rounded-xl mb-3">
            <FileUp className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Upload a Document</h3>
          <p className="text-sm text-slate-500 mt-1">
            Upload a PDF, Word document, or text file for AI analysis and Q&A
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-slate-300 bg-slate-50 hover:border-slate-400"
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Reading file...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1} />
              <p className="text-sm text-slate-500 mb-2">
                Drag and drop your file here
              </p>
              <p className="text-xs text-slate-400 mb-4">or</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-50 transition-all">
                <FileText className="w-4 h-4" />
                Browse Files
                <input
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-400 mt-4">
                Supports PDF, Word (.docx, .doc), Text (.txt, .md, .rtf)
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

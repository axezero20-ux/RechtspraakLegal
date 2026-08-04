import { jsPDF } from "jspdf";

const doc = new jsPDF({ unit: "mm", format: "a4" });
const PW = 210, PH = 297, M = 20, CW = PW - M * 2;
let y = 0;
let page = 1;

function footer() {
  doc.setFontSize(7.5);
  doc.setTextColor(150);
  doc.text("Rechtspraak AI — Application Documentation", M, PH - 12);
  doc.text(`Page ${page}`, PW - M - 15, PH - 12);
  doc.setDrawColor(220);
  doc.line(M, PH - 15, PW - M, PH - 15);
}

function newPage() {
  footer();
  doc.addPage();
  page++;
  y = M;
}

function space(h) { y += h; if (y > PH - 20) newPage(); }

function h1(text) {
  space(10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(text, M, y);
  y += 3;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  doc.line(M, y, PW - M, y);
  y += 6;
}

function h2(text) {
  space(8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(text, M, y);
  y += 5;
}

function h3(text) {
  space(5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text(text, M, y);
  y += 4;
}

function para(text, opts = {}) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const lines = doc.splitTextToSize(text, CW - (opts.indent || 0));
  for (const line of lines) {
    if (y > PH - 20) newPage();
    doc.text(line, M + (opts.indent || 0), y);
    y += 4.5;
  }
}

function bullet(text, indent = 0) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const lines = doc.splitTextToSize(text, CW - indent - 5);
  doc.setFillColor(37, 99, 235);
  doc.circle(M + indent + 1, y - 1.2, 0.7, "F");
  doc.text(lines[0], M + indent + 5, y);
  y += 4.5;
  for (let i = 1; i < lines.length; i++) {
    if (y > PH - 20) newPage();
    doc.text(lines[i], M + indent + 5, y);
    y += 4.5;
  }
}

function table(headers, rows) {
  const colW = CW / headers.length;
  // header
  doc.setFillColor(37, 99, 235);
  doc.rect(M, y - 3, CW, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  headers.forEach((h, i) => {
    doc.text(doc.splitTextToSize(h, colW - 3)[0], M + i * colW + 1.5, y + 0.5);
  });
  y += 6;
  // rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  rows.forEach((row, ri) => {
    if (y > PH - 20) newPage();
    if (ri % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(M, y - 3, CW, 5, "F"); }
    doc.setTextColor(51, 65, 85);
    row.forEach((cell, i) => {
      const lines = doc.splitTextToSize(String(cell), colW - 3);
      doc.text(lines[0], M + i * colW + 1.5, y + 0.5);
    });
    y += 5;
  });
  y += 3;
}

// ═══════════════════════════════════════
// COVER PAGE
// ═══════════════════════════════════════
doc.setFillColor(15, 23, 42);
doc.rect(0, 0, PW, PH, "F");

doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(34);
doc.text("Rechtspraak AI", M, 55);

doc.setFont("helvetica", "normal");
doc.setFontSize(13);
doc.setTextColor(148, 163, 184);
doc.text("AI-Powered Dutch Legal Research Assistant", M, 65);

doc.setDrawColor(37, 99, 235);
doc.setLineWidth(1);
doc.line(M, 72, M + 60, 72);

doc.setFontSize(10);
doc.setTextColor(203, 213, 225);
doc.text("Application Documentation & Feature Guide", M, 82);
doc.text("Version 1.0", M, 88);
doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, M, 94);

doc.setFontSize(9);
doc.setTextColor(100, 116, 139);
doc.text("Author: Leronegroup", M, PH - 30);
doc.text("Contact: info@leronegroup.com", M, PH - 25);
doc.text("Website: https://leronegroup.com", M, PH - 20);

doc.addPage();
page++;
y = M;

// ═══════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════
h1("Table of Contents");
const toc = [
  "1. Application Overview",
  "2. Authentication & User Accounts",
  "3. Dashboard & Navigation",
  "4. Case Search",
  "5. ECLI Case Lookup",
  "6. Case Viewer & AI Tools",
  "7. AI Legal Analysis",
  "8. Case Comparison",
  "9. Similar Precedents Finder",
  "10. Document Upload & AI Chat",
  "11. Matters Management",
  "12. Matter Workspace",
  "13. Settings & API Configuration",
  "14. Help & Setup Guide",
  "15. PDF Export",
  "16. AI Provider Integration",
  "17. Database Schema",
  "18. Subscription Plans & Limits",
  "19. Edge Functions",
  "20. External API Integrations",
  "21. Security & Privacy",
];
toc.forEach(t => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(t, M + 5, y);
  y += 6;
  if (y > PH - 20) newPage();
});

newPage();

// ═══════════════════════════════════════
// 1. OVERVIEW
// ═══════════════════════════════════════
h1("1. Application Overview");
para("Rechtspraak AI is an AI-powered Dutch legal research assistant that searches Dutch court rulings from Rechtspraak.nl (the official Dutch judiciary open data API), uses AI to summarize, analyze, compare, and find similar precedents for cases, and organizes legal work into matters (case files). It is built as a single-page React application with Supabase for authentication, database persistence, and serverless edge functions.");

h3("Technology Stack");
bullet("Frontend: React 18 with TypeScript, Tailwind CSS, Lucide React icons");
bullet("Build tool: Vite");
bullet("Backend: Supabase (PostgreSQL, Auth, Edge Functions)");
bullet("AI Providers: Anthropic Claude API and OpenRouter (multi-model)");
bullet("PDF generation: jsPDF");
bullet("Document parsing: pdfjs-dist (PDF), mammoth (DOCX)");
bullet("Desktop packaging: Electron (Windows, macOS, Linux)");

h3("Core Capabilities");
bullet("Search Dutch court cases with filters (court, date, type, subject)");
bullet("Look up cases directly by ECLI code");
bullet("AI-powered case summaries and deep legal analysis");
bullet("Compare 2-4 cases side by side with AI");
bullet("Find similar precedent cases using AI");
bullet("Upload legal documents (PDF/DOCX/TXT) for AI analysis and Q&A");
bullet("Organize research into matters with saved searches, comparisons, and uploads");
bullet("Export case reports and comparison reports as PDF");
bullet("Pin frequently referenced cases and documents");
bullet("Chat with AI about any case or uploaded document");

newPage();

// ═══════════════════════════════════════
// 2. AUTH
// ═══════════════════════════════════════
h1("2. Authentication & User Accounts");
para("Rechtspraak AI uses Supabase email/password authentication with email verification via OTP code.");

h3("Sign Up");
bullet("Fields: First Name, Last Name, Email, Phone (+31 6... format), Password (min 8 chars), Confirm Password");
bullet("Client-side validation for all fields, email format, password length, and password match");
bullet("On signup, a confirmation email with a numeric OTP code is sent to the user's inbox");
bullet("Profile is auto-created in the database via a trigger when the auth user is created");

h3("Email Verification");
bullet("Numeric OTP code entry (digits only, inputMode numeric)");
bullet("Verify button submits the code via Supabase auth.verifyOtp");
bullet("Resend code button available if the code didn't arrive");
bullet("After clicking the confirmation link in the email, a success landing page is shown (no auto-login)");

h3("Sign In");
bullet("Email and password fields with show/hide password toggle");
bullet("If email is not confirmed, user is redirected to the verification screen");
bullet("Session is persisted across browser refreshes with automatic token refresh");

h3("Profile Data");
bullet("User profiles stored in the profiles table (extends auth.users)");
bullet("Fields: id, email, first_name, last_name, phone, created_at, updated_at");
bullet("Fallback profile creation if the trigger fails (client-side insert)");

newPage();

// ═══════════════════════════════════════
// 3. DASHBOARD
// ═══════════════════════════════════════
h1("3. Dashboard & Navigation");
para("The dashboard is the main interface after authentication. It provides a top navigation bar, a left sidebar for matters, and a main content area that switches between case viewing and matter workspaces.");

h3("Top Navigation Bar");
bullet("Scale logo with 'Rechtspraak AI' title and 'Dutch Legal Research Assistant' subtitle");
bullet("User profile chip showing first name, last name, and initial avatar");
bullet("AI provider badge indicating 'Claude API' or 'OpenRouter'");
bullet("Help button (opens help guide in a modal overlay)");
bullet("Settings button (opens API configuration screen)");
bullet("Sign Out button");

h3("Left Sidebar");
bullet("Matters management sidebar for creating, renaming, archiving, and deleting legal matters");
bullet("Active and archived matter lists with context menus");

h3("Main Content Area");
bullet("Case Viewer: displayed when a specific case ECLI is selected");
bullet("Matter Workspace: displayed when a matter is active");
bullet("Empty state: shows a welcome screen listing all available features");

newPage();

// ═══════════════════════════════════════
// 4. SEARCH
// ═══════════════════════════════════════
h1("4. Case Search");
para("The search panel allows users to search Dutch court cases from Rechtspraak.nl with powerful filters. Up to 50 results are returned per search.");

h3("Search Filters");
bullet("Date range: From and To dates");
bullet("Case type: Uitspraak (judgment) or Conclusie (conclusion)");
bullet("Court: 17 Dutch courts including Hoge Raad (HR), Gerechtshoven (GHAMS, GHDHA, GHARL, GHSHE), Rechtbanken (RBAMS, RBDHA, RBROT, RBMNE, RBLIM, RBGEL, RBOVE, RBNHO, RBNNE), Raad van State (RVS), Centrale Raad van Beroep (CRVB), College van Beroep (CBB)");
bullet("Subject: 9 legal areas — Civiel, Strafrecht, Bestuursrecht, Arbeidsrecht, Familierecht, Insolventierecht, Belastingrecht, Sociale zekerheid, Vreemdelingenrecht");
bullet("Active filter count badge and clear-all-filters button");

h3("Search Results");
bullet("Each result shows: ECLI code (monospace blue), case title, summary, and updated date");
bullet("Click any result to open it in the Case Viewer");

h3("Saved Searches (Matter-Scoped)");
bullet("Save current query, filters, and results to the active matter");
bullet("History panel with delete option");
bullet("Free plan: keeps only 1 most recent saved search. Pro: unlimited");

h3("Pinned Cases (Matter-Scoped)");
bullet("Pin frequently referenced cases for quick access");
bullet("Free plan: only 1 pinned case. Pro: unlimited");

newPage();

// ═══════════════════════════════════════
// 5. ECLI
// ═══════════════════════════════════════
h1("5. ECLI Case Lookup");
para("The ECLI panel allows direct lookup of a case by its ECLI (European Case Law Identifier) code, such as ECLI:NL:PHR:2023:1.");

h3("Features");
bullet("Input field for ECLI code with a Load Case button");
bullet("On load, the case is automatically pinned to the user's pinned ECLI cases list");
bullet("Pinned ECLI cases panel (toggle bar at top) with count badge");
bullet("Click a pinned case to reload it instantly");
bullet("Unpin button on hover for each pinned case");
bullet("Free plan: 1 ECLI pin. Pro: unlimited");

h3("ECLI Pin Persistence");
bullet("Pinned ECLI cases are stored in the ecli_pins database table");
bullet("Unique constraint per user (one pin per ECLI code per user)");
bullet("Server-side trigger enforces the free plan limit");

newPage();

// ═══════════════════════════════════════
// 6. CASE VIEWER
// ═══════════════════════════════════════
h1("6. Case Viewer & AI Tools");
para("The Case Viewer is the primary workspace for case research. It displays a single case with metadata, full text, and five tabs of AI-powered tools.");

h3("Header");
bullet("Back button, ECLI badge, case title");
bullet("Metadata: court/creator, date, case number (zaaknummer), subject");
bullet("Save button with last-saved timestamp");
bullet("Export PDF button");

h3("Tab 1: AI Summary");
bullet("Generates a structured summary using AI (Overview, Key Facts, Legal Issues, Court's Decision, Legal Reasoning, Significance)");
bullet("Rendered as GitHub-flavored markdown");
bullet("Regenerate button to create a fresh summary");

h3("Tab 2: Analysis");
bullet("Deep legal analysis with structured output (see section 7)");

h3("Tab 3: Precedents");
bullet("Find similar precedent cases using AI (see section 9)");

h3("Tab 4: Ask Questions (Chat)");
bullet("Interactive AI chat about the case with context awareness");
bullet("AI automatically fetches referenced ECLI cases mentioned in the conversation (up to 5 cases)");
bullet("Suggestion chips: 'What is this case about?', 'Compare with ECLI:...', 'Draft a case note', etc.");
bullet("Clear conversation button with confirmation modal");
bullet("If AI fetched referenced cases, a notice is prepended to the response");

h3("Tab 5: Case Text");
bullet("Raw case text display for reading the full judgment");

h3("Save & Persistence");
bullet("All work (summary, analysis, precedents, chat) is saved to the case_views table");
bullet("Unique per user per ECLI code — reopening a case restores all saved work");

newPage();

// ═══════════════════════════════════════
// 7. ANALYSIS
// ═══════════════════════════════════════
h1("7. AI Legal Analysis");
para("The analysis panel generates a structured legal analysis of a case using AI, returning organized data across multiple dimensions.");

h3("Overview Cards");
bullet("Legal Area classification (blue card)");
bullet("Outcome determination (emerald card)");
bullet("Optional Legal Significance banner (amber, when available)");

h3("Analysis Sections (5 tabs with item-count badges)");
bullet("Legal Principles: numbered list of identified legal principles");
bullet("Key Arguments: arguments with party identification and outcome pills (accepted=green, rejected=red, partial=amber)");
bullet("Cited Legislation: legislation titles with article number chips and relevance notes");
bullet("Referenced Cases: cited cases with ECLI, title, and how they were referenced");
bullet("Timeline: vertical chronological timeline with dates and events");

h3("Fallback");
bullet("If structured JSON parsing fails, the raw analysis text is rendered as markdown");
bullet("Regenerate Analysis button available");

newPage();

// ═══════════════════════════════════════
// 8. COMPARISON
// ═══════════════════════════════════════
h1("8. Case Comparison");
para("The comparison panel allows users to compare 2 to 4 Dutch court cases side by side using AI, producing a structured comparative analysis.");

h3("Case Loading");
bullet("2 to 4 case slots (add/remove, minimum 2 required)");
bullet("Each slot can search Rechtspraak.nl (max 20 results) or accept a direct ECLI paste");
bullet("Direct ECLI detection via regex pattern matching (ECLI:...)");

h3("Comparison Results");
bullet("Comparative Summary: overall summary of the comparison (blue panel)");
bullet("Common Principles: shared legal principles across cases (emerald checkmarks)");
bullet("Convergence Points: areas where cases agree (green)");
bullet("Divergence Points: areas where cases disagree (red)");
bullet("Key Differences table: topic-by-topic comparison with per-ECLI positions");
bullet("Legal Evolution: analysis of how the law has evolved across the cases (amber)");

h3("Save & History (Matter-Scoped)");
bullet("Save comparisons to the active matter with all ECLI codes and results");
bullet("History list showing 'ECLI vs ECLI' with date");
bullet("Delete saved comparisons");

h3("Export");
bullet("Export comparison report as PDF");

newPage();

// ═══════════════════════════════════════
// 9. PRECEDENTS
// ═══════════════════════════════════════
h1("9. Similar Precedents Finder");
para("The precedents panel uses AI to find similar precedent cases for a given case by searching candidate cases and analyzing their relevance.");

h3("How It Works");
bullet("Searches candidate cases using the case subject and title (max 30 results)");
bullet("Performs a broad supplementary search (max 30 results)");
bullet("Deduplicates and excludes the current case");
bullet("AI analyzes up to 20 candidates for similarity");

h3("Results Display");
bullet("Precedent Analysis summary (blue panel)");
bullet("Sorted precedent cards by similarity level: High (emerald), Medium (blue), Low (slate)");
bullet("Each card shows: ECLI (clickable to open), similarity pill, title, reason for similarity, shared principles chips, key difference");
bullet("Open button to view the precedent case in the Case Viewer");
bullet("Regenerate Search button");

newPage();

// ═══════════════════════════════════════
// 10. UPLOAD
// ═══════════════════════════════════════
h1("10. Document Upload & AI Chat");
para("The upload panel allows users to upload legal documents, extract text, get AI summaries, and chat about the content.");

h3("Supported File Types");
bullet("PDF (.pdf) — text extracted via pdfjs-dist");
bullet("Word documents (.doc, .docx) — text extracted via mammoth");
bullet("Text files (.txt, .md, .rtf) — read directly");
bullet("Maximum text length: 80,000 characters (truncated with notice if exceeded)");

h3("Upload Interface");
bullet("Drag-and-drop zone and file browse button");
bullet("File text extraction happens client-side in the browser");

h3("AI Summary");
bullet("Generates a structured summary: Document Overview, Key Points, Legal Issues, Conclusions");

h3("AI Chat");
bullet("Interactive chat about the uploaded document");
bullet("Same context-aware AI as case chat (fetches referenced ECLI cases)");
bullet("Suggestion chips for quick questions");

h3("Persistence (Matter-Scoped)");
bullet("Save uploaded documents to the active matter");
bullet("Autosave of summary and chat (debounced 1.5 seconds)");
bullet("History panel with saved documents");
bullet("Pinned Documents panel (toggle bar at top, amber styling)");
bullet("Pin/unpin individual documents");
bullet("Free plan: 1 saved document per matter. Pro: unlimited");

h3("Export");
bullet("Export document summary and chat as PDF");

newPage();

// ═══════════════════════════════════════
// 11. MATTERS SIDEBAR
// ═══════════════════════════════════════
h1("11. Matters Management");
para("Matters are legal case files that organize all research work. The sidebar provides full CRUD operations for matters.");

h3("Creating Matters");
bullet("New Matter button with inline input (Enter to create, Esc to cancel)");
bullet("Fields: title, client reference, jurisdiction");
bullet("Free plan limit indicator: '{count}/1 active matters (Free)'");
bullet("Upgrade modal shown when limit is reached");

h3("Matter Operations");
bullet("Rename: inline rename of any matter");
bullet("Archive: move matter to archived state (status = 'archived')");
bullet("Unarchive: restore archived matter to active");
bullet("Delete: permanently deletes matter and all its items and chat history (with confirmation modal)");
bullet("Show/Hide archived toggle");

h3("Matter List Display");
bullet("Active matters: blue dot indicator");
bullet("Archived matters: slate dot, reduced opacity, archive icon");
bullet("Per-matter context menu (three-dot) for all operations");

h3("Upgrade Modal");
bullet("Shown when free plan limit is reached");
bullet("Lists Pro features: unlimited matters, unlimited AI chat, priority analysis, pin cases/articles/notes");

newPage();

// ═══════════════════════════════════════
// 12. MATTER WORKSPACE
// ═══════════════════════════════════════
h1("12. Matter Workspace");
para("The matter workspace is the workspace view for a single matter, with tabs for all research tools and matter-specific data.");

h3("Header");
bullet("Back to matters button");
bullet("Matter title with Scale icon");
bullet("Metadata: client reference, jurisdiction, created date");

h3("Tabs (5)");
bullet("Search: case search with matter-scoped saved searches and pinned cases");
bullet("ECLI Code: direct ECLI lookup with matter-scoped pinned ECLI cases");
bullet("Compare: case comparison with matter-scoped saved comparisons");
bullet("Upload: document upload with matter-scoped saved documents and pinned documents");
bullet("Cases: pinned cases for this matter (with count badge)");

h3("Cases Tab");
bullet("Add Case button with search (max 20 results) or direct ECLI paste");
bullet("List of pinned case items with ECLI, title, and 'Open case viewer' link");
bullet("Delete pinned cases from the matter");

newPage();

// ═══════════════════════════════════════
// 13. SETTINGS
// ═══════════════════════════════════════
h1("13. Settings & API Configuration");
para("The settings screen allows users to configure their AI provider, API key, and model selection.");

h3("Provider Selection");
bullet("Claude API (Anthropic): orange 'AI' badge, direct Anthropic integration");
bullet("OpenRouter: emerald 'OR' badge, multi-model access including 14+ free models");

h3("API Key");
bullet("Password/text toggle with Show/Hide button");
bullet("Placeholder shows expected format (sk-ant-... for Claude, sk-or-... for OpenRouter)");
bullet("Validation: Claude keys must start with 'sk-ant', OpenRouter keys must be 20+ characters");
bullet("Stored locally in browser localStorage — never sent to Rechtspraak AI servers");

h3("Model Selection");
bullet("Free text input with datalist suggestions");
bullet("Claude model suggestions: Sonnet 4, 3.5 Sonnet, 3.5 Haiku, Opus 4");
bullet("OpenRouter: 14 free model suggestions including NVIDIA Nemotron family, Google Gemma, OpenAI gpt-oss, and more");
bullet("Note for OpenRouter: 'All listed models are free on OpenRouter'");

h3("Additional Features");
bullet("Reset to Defaults button (settings mode)");
bullet("Cancel button (settings mode)");
bullet("Links to console.anthropic.com / openrouter.ai for obtaining keys (onboarding mode)");
bullet("Feature trio display on first-time setup: Search Cases, AI Analysis, Local Storage");

newPage();

// ═══════════════════════════════════════
// 14. HELP
// ═══════════════════════════════════════
h1("14. Help & Setup Guide");
para("The help panel is an accordion-style guide for obtaining and configuring a Claude API key. It is accessible via the Help button in the top navigation bar (next to Settings).");

h3("7 Collapsible Sections");
bullet("Overview: prerequisites, steps at a glance, security warning");
bullet("Steps 1-5: Create an API Key — sign in to platform.claude.com, open API keys, create key, name and set expiry, copy and store securely");
bullet("Steps 6-7: Add Billing Credits — add funds, buy credits ($5/$20/$100/Other)");
bullet("Steps 8-9: Choose a Model — find models on Dashboard, copy exact model ID");
bullet("Steps 10-11: Configure in Rechtspraak AI — open Settings, select Claude API, paste key and model, save");
bullet("Quick Checklist: 6-item pre-flight checklist");
bullet("Troubleshooting: API errors, invalid model, lost key, wrong provider");

h3("Privacy Footer");
bullet("'Your API key is stored only in your browser's local storage. It is never transmitted to Rechtspraak AI servers.'");

newPage();

// ═══════════════════════════════════════
// 15. PDF EXPORT
// ═══════════════════════════════════════
h1("15. PDF Export");
para("Rechtspraak AI generates professional PDF reports using jsPDF. Two export types are available.");

h3("Case Report (exportToPDF)");
bullet("A4 portrait, 20mm margins, 16mm footer");
bullet("Dark header bar: 'Legal Case Analysis Report / Rechtspraak.nl | AI-Powered Legal Research'");
bullet("Case title and metadata table (ECLI, Court, Date, Case No., Subject)");
bullet("AI Summary section (rendered from markdown)");
bullet("Q&A section (user questions as headings, assistant answers rendered)");
bullet("Legal Analysis section (Legal Area, Legal Principles, Key Arguments table, Cited Legislation table, Referenced Cases table, Timeline table, Outcome, Significance)");
bullet("Similar Precedents table");
bullet("Case Text (cleaned, truncated to 6,000 characters)");
bullet("Footer on every page: 'For informational purposes only. Does not constitute legal advice.' + page numbers");
bullet("Saved as '{title}.pdf'");

h3("Comparison Report (exportComparisonToPDF)");
bullet("Header bar: 'Case Comparison Report'");
bullet("Cases Compared section (ECLI + title + creator/date for each case)");
bullet("Comparative Summary, Common Principles, Convergence/Divergence Points");
bullet("Key Differences table (topic + per-ECLI positions)");
bullet("Legal Evolution section");
bullet("Saved as '{title}_comparison.pdf'");

h3("Markdown Rendering in PDF");
bullet("Supports headings, bullets, numbered lists, pipe-delimited tables, and paragraphs");
bullet("Inline markdown stripping (bold, italic, code, links)");
bullet("Case text cleaning: strips leading XML/metadata by finding court markers");

newPage();

// ═══════════════════════════════════════
// 16. AI PROVIDER
// ═══════════════════════════════════════
h1("16. AI Provider Integration");
para("Rechtspraak AI supports two AI providers, with all API calls made server-side via the rechtspraak-ai edge function.");

h3("Claude API (Anthropic)");
bullet("Endpoint: api.anthropic.com/v1/messages");
bullet("Authentication: x-api-key header with user's API key");
bullet("API version: anthropic-version: 2023-06-01");
bullet("Default model: claude-sonnet-4-20250514");
bullet("Max tokens: 4,096 (varies by operation)");

h3("OpenRouter (Multi-Model)");
bullet("Endpoint: openrouter.ai/api/v1/chat/completions");
bullet("Authentication: Bearer token with user's API key");
bullet("HTTP-Referer and X-Title headers sent for attribution");
bullet("Free model fallback: tries requested model, then 23 static free models, then dynamically fetches available free models");
bullet("If all free models fail: 'All available free models are currently unavailable'");
bullet("Paid models: tries once, throws on failure");

h3("AI Operations (7 actions via edge function)");
table(
  ["Operation", "Max Input", "Max Tokens", "Description"],
  [
    ["Search", "N/A", "N/A", "Search Rechtspraak.nl (no AI call)"],
    ["Get Content", "80,000 chars", "N/A", "Fetch case text (no AI call)"],
    ["Flexible Chat", "40,000 chars + 5 ref cases", "4,096", "Context-aware chat with auto ECLI fetching"],
    ["Summarize", "30,000 chars", "4,000", "Structured case summary"],
    ["Analyze", "40,000 chars", "4,096", "Deep legal analysis (JSON)"],
    ["Compare Cases", "20,000 chars each", "4,096", "Multi-case comparison (JSON)"],
    ["Find Similar", "15,000 chars + 20 cand.", "4,096", "Similar precedents (JSON)"],
  ]
);

newPage();

// ═══════════════════════════════════════
// 17. DATABASE
// ═══════════════════════════════════════
h1("17. Database Schema");
para("The application uses Supabase PostgreSQL with Row Level Security (RLS) on all tables. All tables are owner-scoped (users can only access their own data).");

h3("Tables Overview");
table(
  ["Table", "Purpose", "RLS", "Free Limit"],
  [
    ["profiles", "User profile data", "Owner CRUD", "—"],
    ["matters", "Legal case files", "Owner CRUD", "1 active"],
    ["matter_items", "Pinned cases/notes in matter", "Via parent", "—"],
    ["matter_chats", "Chat history per matter", "Via parent", "—"],
    ["subscriptions", "User plan (free/pro)", "Owner CRUD", "—"],
    ["matter_searches", "Saved search queries", "Via parent", "1 per user"],
    ["matter_comparisons", "Saved case comparisons", "Via parent", "—"],
    ["matter_uploads", "Uploaded documents + AI", "Via parent", "1 per matter"],
    ["case_views", "Saved case work", "Owner CRUD", "1 per user"],
    ["ecli_pins", "ECLI panel pinned cases", "Owner CRUD", "1 per user"],
  ]
);

h3("Key Schema Details");
bullet("profiles: extends auth.users with first_name, last_name, phone; auto-created via trigger");
bullet("matters: status CHECK (active/archived); user_id defaults to auth.uid()");
bullet("matter_items: type CHECK (case/article/note/document/timeline); scoped via parent matter ownership");
bullet("case_views: UNIQUE (user_id, ecli) — one saved view per case per user");
bullet("ecli_pins: UNIQUE (user_id, ecli) — one pin per ECLI per user");
bullet("matter_uploads: pinned boolean (default false) with index on (matter_id, pinned)");

newPage();

// ═══════════════════════════════════════
// 18. PLANS
// ═══════════════════════════════════════
h1("18. Subscription Plans & Limits");
para("Rechtspraak AI has two subscription tiers: Free and Pro. Limits are enforced through a combination of edge functions, database triggers, and UI messaging.");

h3("Plan Comparison");
table(
  ["Feature", "Free", "Pro"],
  [
    ["Active matters", "1", "Unlimited"],
    ["Saved searches", "1 (per user)", "Unlimited"],
    ["Pinned cases (case_views)", "1 (per user)", "Unlimited"],
    ["ECLI pins", "1 (per user)", "Unlimited"],
    ["Saved documents per matter", "1 (UI-enforced)", "Unlimited"],
    ["AI chat", "Unlimited", "Unlimited"],
    ["Case comparisons", "Unlimited", "Unlimited"],
    ["Similar precedents", "Unlimited", "Unlimited"],
    ["AI summaries/analysis", "Unlimited", "Unlimited"],
  ]
);

h3("Enforcement Mechanisms");
bullet("Matters: edge function 'matter-limits' (server-side check before creation)");
bullet("Saved searches: SECURITY DEFINER trigger 'enforce_search_history_limit' (DB-level, keeps newest only)");
bullet("Pinned cases: SECURITY DEFINER trigger 'enforce_pinned_case_limit' (DB-level, keeps newest only)");
bullet("ECLI pins: SECURITY DEFINER trigger 'enforce_ecli_pin_limit' (DB-level, keeps newest only)");
bullet("Saved documents: UI-only messaging (no server-side enforcement)");
bullet("Pro status validation: edge function checks plan='pro' AND status='active' AND current_period_end > now");

newPage();

// ═══════════════════════════════════════
// 19. EDGE FUNCTIONS
// ═══════════════════════════════════════
h1("19. Edge Functions");
para("Two Supabase Edge Functions handle server-side operations.");

h3("rechtspraak-ai");
bullet("Endpoint: POST /functions/v1/rechtspraak-ai");
bullet("Auth: Supabase anon key (Bearer token)");
bullet("Handles 7 actions: search, getContent, chat, flexibleChat, summarize, analyze, compareCases, findSimilar");
bullet("CORS: Allow-Origin *, all methods, standard headers");
bullet("Proxies all AI calls (Claude/OpenRouter) server-side to keep user API keys off the client");
bullet("Searches Rechtspraak.nl XML API with server-side filtering for courts, dates, and subjects not natively supported");
bullet("Flexible chat: scans messages for ECLI patterns, auto-fetches up to 5 referenced cases (30,000 chars each)");

h3("matter-limits");
bullet("Endpoint: GET /functions/v1/matter-limits");
bullet("Auth: User access token (Authorization header)");
bullet("Free plan limit: 1 active matter");
bullet("Pro plan: unlimited (limit = -1)");
bullet("Validates Pro status: checks plan, status, and current_period_end");
bullet("Returns: {allowed, plan, activeCount, limit}");

newPage();

// ═══════════════════════════════════════
// 20. EXTERNAL APIS
// ═══════════════════════════════════════
h1("20. External API Integrations");
para("Rechtspraak AI integrates with several external APIs, all called server-side from edge functions.");

h3("Rechtspraak.nl (Dutch Judiciary Open Data)");
bullet("Search: data.rechtspraak.nl/uitspraken/zoeken (XML format)");
bullet("Content: data.rechtspraak.nl/uitspraken/content?id={ecli} (XML format)");
bullet("No authentication required");
bullet("Server-side filtering for courts, date ranges, and subjects not natively supported by the API");

h3("Anthropic Claude API");
bullet("Endpoint: api.anthropic.com/v1/messages");
bullet("Authentication: x-api-key header");
bullet("Version: anthropic-version: 2023-06-01");
bullet("Used for: chat, summaries, analysis, comparisons, precedent finding");

h3("OpenRouter API");
bullet("Endpoint: openrouter.ai/api/v1/chat/completions");
bullet("Authentication: Bearer token");
bullet("Model listing: openrouter.ai/api/v1/models (for free model fallback)");
bullet("Used for: same AI operations as Claude, with free model fallback chain");

newPage();

// ═══════════════════════════════════════
// 21. SECURITY
// ═══════════════════════════════════════
h1("21. Security & Privacy");
para("Rechtspraak AI implements multiple layers of security and privacy protection.");

h3("Data Security");
bullet("Row Level Security (RLS) enabled on all database tables");
bullet("Users can only access their own data (owner-scoped policies)");
bullet("Matter-scoped tables (items, chats, searches, comparisons, uploads) enforce ownership via parent matter check");
bullet("SECURITY DEFINER functions used for limit-enforcement triggers (elevated privileges for cross-table queries)");
bullet("All AI API calls proxied through edge functions — user API keys never exposed to the client-side network calls");

h3("API Key Storage");
bullet("AI provider API keys stored in browser localStorage only");
bullet("Never transmitted to Rechtspraak AI servers (only sent to the edge function which forwards to the AI provider)");
bullet("Show/Hide toggle for password fields");
bullet("Key validation: format checking (sk-ant prefix for Claude, length for OpenRouter)");

h3("Authentication");
bullet("Email/password authentication via Supabase Auth");
bullet("Email verification required (OTP code)");
bullet("Session persistence with automatic token refresh");
bullet("Email confirmation link does not auto-login (security measure)");

h3("Privacy");
bullet("No data sharing between users");
bullet("All user data is isolated by user_id");
bullet("API keys are client-side only");
bullet("PDF exports include disclaimer: 'For informational purposes only. Does not constitute legal advice.'");

footer();
doc.save("Rechtspraak_AI_Documentation.pdf");
console.log("PDF generated successfully: Rechtspraak_AI_Documentation.pdf");

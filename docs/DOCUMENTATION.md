# Rechtspraak AI — Full Application Documentation

**Version:** 1.0.0  
**Author:** Leronegroup (info@leronegroup.com)  
**Homepage:** https://leronegroup.com  
**Date:** October 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Authentication & User Management](#4-authentication--user-management)
5. [AI Provider Configuration](#5-ai-provider-configuration)
6. [Matters & Workspace System](#6-matters--workspace-system)
7. [Case Search](#7-case-search)
8. [ECLI Code Lookup](#8-ecli-code-lookup)
9. [Case Viewer](#9-case-viewer)
10. [AI Case Analysis](#10-ai-case-analysis)
11. [Similar Precedents Finder](#11-similar-precedents-finder)
12. [Case Comparison](#12-case-comparison)
13. [Document Upload & Analysis](#13-document-upload--analysis)
14. [AI Chat](#14-ai-chat)
15. [PDF Export](#15-pdf-export)
16. [Subscription & Plan Limits](#16-subscription--plan-limits)
17. [Database Schema](#17-database-schema)
18. [Edge Functions](#18-edge-functions)
19. [Electron Desktop Application](#19-electron-desktop-application)
20. [File Structure](#20-file-structure)
21. [Security](#21-security)
22. [Building & Deployment](#22-building--deployment)

---

## 1. Overview

Rechtspraak AI is an AI-powered Dutch legal case search and analysis tool. It provides lawyers, legal researchers, and law students with a comprehensive workspace for searching Dutch court rulings from Rechtspraak.nl, analyzing cases with AI, comparing multiple rulings, finding similar precedents, uploading legal documents for AI-assisted Q&A, and exporting professional PDF reports.

The application is built as a React SPA (Single Page Application) that can also be packaged as a desktop application via Electron. It uses Supabase for authentication and data persistence, and supports two AI providers: Anthropic Claude and OpenRouter (which provides access to multiple free and paid models).

### Key Capabilities

- **Search** the official Rechtspraak.nl database with filters for court, date range, subject area, and case type
- **Load cases by ECLI** (European Case Law Identifier) directly
- **AI Summaries** — generate structured summaries of any court ruling
- **Deep Legal Analysis** — extract legal principles, key arguments, cited legislation, referenced cases, and a timeline of events
- **Similar Precedents** — find and rank related cases by similarity
- **Case Comparison** — compare 2–4 cases side-by-side for commonalities, differences, convergence, divergence, and legal evolution
- **Document Upload** — upload PDF, Word, or text files for AI-powered summarization and Q&A
- **AI Chat** — ask questions about any case or uploaded document in natural language
- **Matters Workspace** — organize research into matter folders with saved searches, comparisons, uploads, and per-matter chat
- **PDF Export** — generate professional legal reports with case metadata, summaries, analysis, precedents, and chat transcripts
- **Pinning** — pin important cases and documents for quick access
- **Subscription tiers** — Free and Pro plans with different limits

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 with TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 with `@tailwindcss/typography` |
| Icons | Lucide React |
| Markdown rendering | `react-markdown` + `remark-gfm` |
| PDF generation | jsPDF 4 |
| PDF text extraction | pdfjs-dist 6 (PDF.js) |
| Word document extraction | mammoth 1 |
| Backend / Auth / DB | Supabase (PostgreSQL, Auth, Edge Functions) |
| AI providers | Anthropic Claude API, OpenRouter API |
| Desktop packaging | Electron 43 + electron-builder |
| Linting | ESLint 9 with TypeScript-ESLint |
| Package manager | npm |

### Key Dependencies

```
@supabase/supabase-js  — Supabase client (auth, database, realtime)
jspdf                  — Client-side PDF generation
lucide-react           — Icon library
mammoth                — .docx text extraction in the browser
pdfjs-dist             — PDF text extraction in the browser
react / react-dom      — UI framework
react-markdown         — Render AI responses as markdown
remark-gfm             — GitHub-flavored markdown (tables, etc.)
```

---

## 3. Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                   │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Auth    │  │ Matters  │  │  Case    │  │ Document │ │
│  │  Screens │  │ Sidebar  │  │  Viewer  │  │  Upload  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │              │              │              │      │
│  ┌────┴──────────────┴──────────────┴──────────────┴────┐ │
│  │              Supabase JS Client                       │ │
│  │         (auth, database queries)                      │ │
│  └────┬──────────────────────────────────┬───────────────┘ │
│       │                                  │                 │
│       │  ┌────────────────────┐         │                 │
│       │  │  api.ts            │         │                 │
│       │  │  (Edge Function    │         │                 │
│       │  │   calls)           │         │                 │
│       │  └────┬───────────────┘         │                 │
│       │       │                          │                 │
│       │       │  localStorage           │                 │
│       │       │  (AI API key/config)    │                 │
└───────┼───────┼──────────────────────────┼─────────────────┘
        │       │                          │
        ▼       ▼                          ▼
   ┌─────────┐  ┌──────────────┐    ┌──────────────┐
   │ Supabase│  │  Supabase    │    │  External    │
   │  Auth   │  │  Postgres DB │    │  APIs        │
   │         │  │  (RLS)       │    │              │
   └─────────┘  └──────────────┘    │  Rechtspraak │
                                   │  .nl API     │
                                   │              │
                                   │  Claude API  │
                                   │  OpenRouter  │
                                   └──────────────┘
```

### Application Flow

1. User opens the app → loading state while Supabase session is restored
2. If no session → Sign In / Sign Up screen
3. If signed in but email not confirmed → Email Verification screen
4. If email confirmation redirect detected → Email Confirmed landing page
5. If signed in and confirmed → Dashboard with Matters Sidebar

The Dashboard shows either:
- **Empty state** — prompting the user to create or select a matter
- **MatterWorkspace** — when a matter is selected (search, ECLI, compare, upload tabs)
- **CaseViewer** — when a case ECLI is selected (summary, analysis, precedents, chat, text tabs)

---

## 4. Authentication & User Management

### Provider

Authentication is handled by **Supabase Auth** using email/password. No social logins or magic links are used.

### Sign Up Flow

1. User provides first name, last name, email, phone, and password (min 8 characters)
2. Supabase `auth.signUp()` is called with user metadata (first_name, last_name, phone)
3. A confirmation email is sent to the user's email address
4. The user is shown an Email Verification screen
5. When the user clicks the confirmation link in the email, they are redirected back to the app
6. The app detects the `type=signup` hash in the redirect URL, signs the user out (to avoid auto-login), and shows an "Email Confirmed" landing page
7. The user can then sign in with their credentials

### Profile Auto-Creation

A PostgreSQL trigger (`handle_new_user`) automatically creates a row in the `profiles` table when a new user signs up in `auth.users`. The trigger extracts `first_name`, `last_name`, and `phone` from the user metadata. If the trigger fails (e.g., race condition), the `AuthContext` has a fallback that creates the profile row from the client side.

### Session Management

- Sessions are persisted across browser refreshes (`persistSession: true`)
- Access tokens are auto-refreshed (`autoRefreshToken: true`)
- `onAuthStateChange` listener detects sign-in, sign-out, and email confirmation redirects
- Email confirmation redirects are specially handled to prevent auto-login before the user explicitly signs in

### Auth Context

The `AuthContext` provides:
- `session` — current Supabase session
- `user` — current Supabase user
- `profile` — profile row from the `profiles` table
- `loading` — whether auth state is being loaded
- `emailConfirmed` — whether an email confirmation just occurred
- `signUp()` — register a new user
- `signIn()` — sign in with email/password
- `signOut()` — sign out and clear state
- `verifyEmailOtp()` — verify an email OTP code
- `refreshProfile()` — re-fetch the profile from the database

---

## 5. AI Provider Configuration

### Supported Providers

The app supports two AI providers:

1. **OpenRouter** (default) — provides access to multiple free and paid models from different providers (NVIDIA, Google, Meta, OpenAI, Cohere, etc.)
2. **Claude (Anthropic)** — direct API access to Claude models

### Configuration Storage

AI provider configuration (provider, API key, model) is stored in the browser's `localStorage` under the key `rechtspraak_ai_config`. The API key is **never** sent to the app's own servers — it is sent only to the Supabase Edge Function which forwards it to the AI provider.

### Default Configuration

- **Provider:** OpenRouter
- **Default model:** `nvidia/nemotron-3-ultra-550b-a55b:free`
- **Default API key:** A pre-configured OpenRouter key is bundled with the app

### Available Models

#### Claude Models
- Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
- Claude 3.5 Haiku (`claude-3-5-haiku-20241022`)
- Claude Opus 4 (`claude-opus-4-20250514`)

#### OpenRouter Models (all free-tier)
- NVIDIA Nemotron 3 Ultra (1M context)
- NVIDIA Nemotron 3 Super
- NVIDIA Nemotron 3 Nano Omni (reasoning)
- NVIDIA Nemotron 3 Nano 30B
- NVIDIA Nemotron Nano 12B VL
- NVIDIA Nemotron Nano 9B V2
- Google Gemma 4 31B / 26B
- OpenAI gpt-oss-20b
- Cohere North Mini Code
- Ling 3.0 Flash
- Poolside Laguna S/XS 2.1

Any custom model ID can also be entered manually.

### Settings Screen

The Settings screen (accessible from the top bar gear icon) allows users to:
- Switch between Claude and OpenRouter
- Enter or update their API key
- Select or type a model ID
- Reset to default configuration
- Save settings (persisted to localStorage)

### API Key Validation

- Claude keys should start with `sk-ant`
- OpenRouter keys must be at least 20 characters

### In-App Help Guide

A comprehensive Help panel is available from the top bar. It provides a step-by-step guide for:
- Creating a Claude API key on the Anthropic Console
- Adding billing credits
- Choosing and copying a model ID
- Configuring the key in Rechtspraak AI
- Troubleshooting common issues

---

## 6. Matters & Workspace System

### Concept

A **Matter** is a folder that groups related legal research work. Each matter contains:
- Saved searches and their results
- Saved case comparisons
- Uploaded documents with AI summaries and chat
- Matter-level chat history
- Matter items (cases, articles, notes, documents, timeline entries)

### Matter Management

The **Matters Sidebar** (left panel, dark theme) provides:

- **Create** a new matter (title, optional client reference, optional jurisdiction)
- **Rename** a matter (inline editing)
- **Archive** / **Unarchive** a matter (archived matters are hidden by default)
- **Delete** a matter (with confirmation — permanently deletes the matter and all associated data)
- **View active vs. archived** matters (toggle to show archived)
- **Active matter count indicator** (shows `X / limit` for Free plan users)

### Matter Workspace

When a matter is selected, the **Matter Workspace** opens with four tabs:

| Tab | Description |
|-----|-------------|
| Search | Search Rechtspraak.nl with filters, save searches, view search history |
| ECLI Code | Load a case directly by its ECLI identifier, pin loaded cases |
| Compare | Load 2–4 cases and compare them with AI analysis |
| Upload | Upload PDF/Word/text documents for AI analysis and Q&A |

### Free Plan Limits

- Maximum **1 active matter**
- Maximum **1 saved search** (most recent only is retained via DB trigger)
- Maximum **1 saved comparison** (most recent only is retained via DB trigger)
- Maximum **1 pinned ECLI case**
- Maximum **1 saved document per matter**

### Pro Plan

- Unlimited active matters
- Unlimited AI chat per matter
- Unlimited saved searches, comparisons, pins, and documents
- Priority analysis & summarization

---

## 7. Case Search

### Data Source

Case search queries the official Dutch judiciary API at `https://data.rechtspraak.nl/uitspraken/zoeken`. This is a public Atom/XML feed of court rulings from the Netherlands.

### Search Parameters

| Parameter | Description | API Support |
|-----------|-------------|-------------|
| Query | Free-text search | Client-side filtering on title/summary |
| From Date | Start of date range | Client-side filtering (parsed from title or ECLI year) |
| To Date | End of date range | Client-side filtering |
| Case Type | Uitspraak (judgment) or Conclusie (conclusion) | Native API parameter |
| Court | Filter by court code (e.g., HR, GHAMS, RBDHA) | Client-side filtering by ECLI prefix |
| Subject | Filter by legal subject (Civiel, Strafrecht, etc.) | Client-side filtering on title/summary |
| Max results | Maximum number of results (default 50) | Native API parameter |

### Court Options

The app supports filtering by 17 Dutch courts:

- Hoge Raad (HR)
- Gerechtshof Amsterdam (GHAMS)
- Gerechtshof Den Haag (GHDHA)
- Gerechtshof Arnhem-Leeuwarden (GHARL)
- Gerechtshof 's-Hertogenbosch (GHSHE)
- Rechtbank Amsterdam (RBAMS)
- Rechtbank Den Haag (RBDHA)
- Rechtbank Rotterdam (RBROT)
- Rechtbank Midden-Nederland (RBMNE)
- Rechtbank Limburg (RBLIM)
- Rechtbank Gelderland (RBGEL)
- Rechtbank Overijssel (RBOVE)
- Rechtbank Noord-Holland (RBNHO)
- Rechtbank Noord-Nederland (RBNNE)
- Raad van State (RVS)
- Centrale Raad van Beroep (CRVB)
- College van Beroep voor het bedrijfsleven (CBB)

### Subject Areas

- Civiel / Civil
- Strafrecht / Criminal
- Bestuursrecht / Administrative
- Arbeidsrecht / Labor
- Familierecht / Family
- Insolventierecht
- Belastingrecht / Tax
- Sociale zekerheid
- Vreemdelingenrecht

### How Server-Side Filtering Works

The Rechtspraak API does not natively support court, subject, date range, or text query filtering. The Edge Function works around this by:

1. Fetching a larger batch (up to 10× the requested max, capped at 1000)
2. Filtering the results server-side by:
   - **Court:** matching the court code in the ECLI (e.g., `ECLI:NL:HR:...` → court code `HR`)
   - **Date range:** parsing dates from the case title (format `DD-MM-YYYY`) or falling back to the ECLI year
   - **Subject:** keyword matching in the title and summary
   - **Text query:** keyword matching in the title and summary
3. Trimming to the requested maximum

### Search Results

Each result displays:
- ECLI identifier (monospace, blue)
- Case title
- Summary snippet
- Last updated date (formatted in Dutch locale)

Clicking a result opens the case in the **Case Viewer**.

### Saved Searches

When inside a matter, users can:
- **Save** the current search results (query + filters + results array)
- **View search history** — list of saved searches with result count and date
- **Load** a saved search (restores results to the screen)
- **Delete** a saved search

Free plan: only the 1 most recent search is retained (enforced by a database trigger that deletes older rows).

### Pinned Cases

From the search panel, users can also view **pinned cases** — cases that have been opened and saved (via the Case Viewer's Save button). These are stored in the `case_views` table and can be unpinned directly from the search panel.

---

## 8. ECLI Code Lookup

### What is ECLI?

ECLI (European Case Law Identifier) is a standardized identifier for court rulings across Europe. Dutch ECLIs follow the format: `ECLI:NL:<COURT>:<YEAR>:<NUMBER>`, e.g., `ECLI:NL:HR:2022:1234`.

### How It Works

1. User enters an ECLI code in the input field
2. The Edge Function fetches the case content from `https://data.rechtspraak.nl/uitspraken/content?id=<ECLI>`
3. The XML response is parsed to extract:
   - Metadata: title, creator (court), date, identifier, subject, zaaknummer (case number), summary
   - Full text: XML tags are stripped, HTML entities are decoded, whitespace is normalized
4. Text is truncated at 80,000 characters for AI processing
5. The case is automatically pinned to the ECLI Pins panel
6. The case opens in the Case Viewer (with `source="ecli"` to use the `ecli_case_views` table for saving)

### Pinned ECLI Cases

- Cases loaded via the ECLI Code tab are auto-pinned
- Pinned cases appear in a collapsible panel with a count badge
- Clicking a pinned case reopens it in the Case Viewer
- Unpinning removes the case from the `ecli_pins` table
- Free plan: only 1 pinned ECLI case at a time (enforced by a database trigger that deletes older pins)
- ECLI pins are independent from search-panel pins (stored in `ecli_pins` vs `case_views`)

### ECLI Pin Enhancements

The `ecli_pins` table also stores case work data (title, summary, analysis, precedents, chat) so that AI-generated work on ECLI-loaded cases is persisted and restored when the case is reopened.

---

## 9. Case Viewer

The Case Viewer is the central screen for examining a single court ruling. It is accessed by:
- Clicking a search result
- Clicking a pinned case
- Loading an ECLI code
- Clicking a precedent from the Similar Precedents panel

### Header

- Back button
- ECLI identifier badge
- Case title
- Metadata: court, date, case number, subject
- Save button (saves summary, analysis, precedents, and chat to the database)
- Export PDF button
- Last saved timestamp

### Tabs

| Tab | Description |
|-----|-------------|
| AI Summary | Generate or view an AI-generated structured summary |
| Analysis | Deep legal analysis (principles, arguments, legislation, references, timeline) |
| Precedents | Find similar precedents from Rechtspraak.nl |
| Ask Questions | Chat with AI about the case |
| Case Text | View the full case text |

### Data Persistence

The Case Viewer saves to different tables depending on the source:
- **Search results** → `case_views` table (upsert on `user_id, ecli`)
- **ECLI-loaded cases** → `ecli_case_views` table (upsert on `user_id, ecli`)

When a case is reopened, the viewer fetches the saved data (summary, analysis, precedents, chat) from the appropriate table and restores the state.

### Case Content Structure

```typescript
interface CaseContent {
  ecli: string;
  metadata: {
    title?: string;
    creator?: string;     // Court name
    date?: string;
    identifier?: string;
    subject?: string;
    zaaknummer?: string;  // Case number
    summary?: string;
  };
  text: string;           // Full case text (truncated at 80,000 chars)
  fullLength: number;     // Original text length before truncation
}
```

---

## 10. AI Case Analysis

### Overview

The **Deep Legal Analysis** feature uses AI to extract structured legal information from a court ruling. It is available in the "Analysis" tab of the Case Viewer.

### What It Extracts

The AI is prompted to return structured JSON containing:

| Field | Description |
|-------|-------------|
| `legalPrinciples` | Array of key legal principles established or applied |
| `keyArguments` | Array of { party, argument, outcome (accepted/rejected/partially accepted) } |
| `citedLegislation` | Array of { title, articles[], relevance } |
| `referencedCases` | Array of { ecli, title, how (how it was used) } |
| `timeline` | Array of { date, event } — chronological events |
| `outcome` | Summary of the final ruling |
| `legalArea` | Area of law (civil, criminal, administrative, labor, etc.) |
| `significance` | Why this case is legally significant |

### Display

The analysis is displayed with:

- **Overview cards** — Legal Area and Outcome at the top
- **Legal Significance** callout — highlighted in amber
- **Section tabs** — Legal Principles, Key Arguments, Cited Legislation, Referenced Cases, Timeline
  - Each tab shows a count badge
  - Principles: numbered list
  - Arguments: cards with party name, argument, and color-coded outcome badge (green=accepted, red=rejected, amber=partial)
  - Legislation: cards with title, article tags (monospace), and relevance
  - Referenced Cases: clickable ECLI links with title and how it was referenced
  - Timeline: vertical timeline with blue dots and dates
- **Regenerate** button to re-run the analysis

### JSON Parsing

The AI response is parsed as JSON. If parsing fails, the raw text is displayed as markdown (fallback). The panel also attempts to extract JSON from within markdown code fences.

### Technical Details

- Case text is truncated to 40,000 characters before being sent to the AI
- System prompt: "You are an expert legal analyst specializing in Dutch law (Rechtspraak)"
- Max tokens: 4,096
- The AI is instructed to respond in the same language as the case, defaulting to English

---

## 11. Similar Precedents Finder

### Overview

The **Similar Precedents** feature searches Rechtspraak.nl for cases related to the current case and uses AI to rank them by similarity.

### How It Works

1. The panel searches Rechtspraak.nl using the case's subject or title as the query (up to 30 results)
2. A broader search is also performed (up to 30 more results)
3. Results are deduplicated and the current case is excluded
4. Up to 20 candidate cases are sent to the AI along with the primary case text (truncated to 15,000 chars)
5. The AI returns structured JSON with:
   - `similarPrecedents` — array of ranked cases with similarity, reason, shared principles, and key difference
   - `precedentSummary` — overall analysis of precedent relationships

### Similarity Levels

| Level | Color | Meaning |
|-------|-------|---------|
| High | Emerald/green | Very similar — strong precedent value |
| Medium | Blue | Moderately similar |
| Low | Slate/gray | Tangentially related |

### Display

Each precedent card shows:
- ECLI (clickable — opens the case in the viewer)
- Similarity badge
- Case title
- Reason for similarity
- Shared principles (as tags)
- Key difference from the primary case
- "Open" button to navigate to the case

Precedents are sorted by similarity (high → medium → low).

---

## 12. Case Comparison

### Overview

The **Case Comparison** feature allows users to load 2–4 court cases and have the AI compare them for commonalities, differences, and legal evolution.

### How It Works

1. The comparison panel starts with 2 empty slots
2. Users can add up to 4 slots (minimum 2 required to compare)
3. Each slot is populated by:
   - Searching Rechtspraak.nl (search panel appears for the active slot)
   - Pasting an ECLI code directly (if it matches the ECLI pattern)
4. When 2 or more slots are loaded, the "Compare Cases" button is enabled
5. The AI receives each case's text (truncated to 20,000 chars each) and metadata
6. The AI returns structured JSON with comparison results

### Comparison Output

| Field | Description |
|-------|-------------|
| `commonPrinciples` | Legal principles shared across all or most cases |
| `differences` | Array of { topic, positions: [{ ecli, position }] } |
| `convergencePoints` | Where the cases agree or converge |
| `divergencePoints` | Where the cases disagree or diverge |
| `legalEvolution` | How the law has evolved across these cases (if different time periods) |
| `comparativeSummary` | Overall comparison summary |

### Display

- **Comparative Summary** — highlighted in blue
- **Common Principles** — green cards with checkmark icons
- **Convergence** (green panel) vs **Divergence** (red panel) — side-by-side
- **Key Differences** — cards per topic with ECLI-tagged positions
- **Legal Evolution** — amber callout

### Saving & Exporting

- **Save** — stores the comparison (ECLIs + result + case metadata) to `matter_comparisons`
- **Export PDF** — generates a professional comparison report
- **History** — view and reload saved comparisons

---

## 13. Document Upload & Analysis

### Overview

The **Upload** tab lets users upload legal documents (PDFs, Word documents, text files) for AI-powered analysis, summarization, and Q&A.

### Supported File Types

| Type | Extensions | Extraction Method |
|------|-----------|-------------------|
| PDF | `.pdf` | PDF.js (pdfjs-dist) — page-by-page text extraction |
| Word | `.docx`, `.doc` | Mammoth — raw text extraction |
| Text | `.txt`, `.md`, `.rtf` | Direct file read |

### Upload Process

1. User drags & drops or browses for a file
2. Text is extracted in the browser (no server upload)
3. Text is truncated at 80,000 characters
4. The file info (name, type, size, extracted text) is displayed
5. User can then:
   - **Generate AI Summary** — structured summary with overview, key points, legal issues, and conclusions
   - **Chat** — ask questions about the document
   - **Save** — persist to `matter_uploads` (file name, type, size, text content, summary, chat)
   - **Pin** — mark as important for quick access
   - **Export PDF** — export the summary and chat as a PDF

### Auto-Save

When a document has been saved (has an upload ID), the chat messages and summary are auto-saved with a 1.5-second debounce whenever they change.

### Saved Documents

- View all saved documents for the current matter in a history panel
- Click to reload any saved document (restores text, chat, and summary)
- Delete saved documents
- Pinned documents appear in a separate panel

### Free Plan Limit

Free plan: 1 saved document per matter (enforced by database trigger).

---

## 14. AI Chat

### Overview

The AI Chat feature is available in two contexts:
1. **Case Viewer** — chat about a specific court ruling
2. **Document Upload** — chat about an uploaded document

### How It Works

The chat uses the `flexibleChat` action in the Edge Function:

1. User messages are sent along with the conversation history
2. The system scans all messages for ECLI patterns (`ECLI:XX:XXXX:YYYY:ZZZZ`)
3. Any referenced ECLIs (up to 5) are automatically fetched from Rechtspraak.nl
4. The primary case text (up to 40,000 chars) and fetched referenced case texts (up to 30,000 chars each) are included as context
5. The AI is instructed to:
   - Act as a flexible legal assistant specializing in Dutch law
   - Answer any question — case analysis, legal reasoning, comparisons, drafting tasks
   - Begin every response with a top-level markdown heading
   - Use GitHub-flavored markdown tables for structured/competitive data
   - Respond in the same language as the user's question, defaulting to English

### Chat Features

- **Message rendering** — user messages in blue bubbles (right-aligned), AI responses in gray bubbles (left-aligned) with full markdown support (tables, lists, headings, code blocks)
- **Suggested questions** — quick-start buttons when the chat is empty
- **Clear conversation** — with confirmation dialog
- **ECLI auto-fetch notification** — when the AI fetches referenced cases, the response is prefixed with "Fetched and analyzed N referenced case(s): ..."
- **Auto-scroll** — chat auto-scrolls to the latest message

### Chat Persistence

- **Case chat** — saved to `case_views` or `ecli_case_views` (depending on source) via the Save button
- **Document chat** — auto-saved to `matter_uploads` (debounced 1.5s)
- **Matter-level chat** — saved to `matter_chats` (one chat per matter)

---

## 15. PDF Export

### Overview

The app generates professional PDF reports client-side using jsPDF. Two export types are available:

### Case Analysis Report

Generated from the Case Viewer, includes:
- **Cover header bar** — "Legal Case Analysis Report" with Rechtspraak.nl branding and generation date
- **Case metadata** — ECLI, court, date, case number, subject
- **AI Summary** — rendered with markdown formatting (headings, tables, lists)
- **Q&A transcript** — each user question as a section heading, AI response rendered as markdown
- **Legal Analysis** — legal area, principles (bulleted), key arguments (table), cited legislation (table), referenced cases (table), timeline (table), outcome, significance
- **Similar Precedents** — summary text and a table of precedents (ECLI, title, similarity, reason, key difference)
- **Case text** — cleaned and truncated to 6,000 characters
- **Footer** on every page: "For informational purposes only. Does not constitute legal advice." + page numbers

### Case Comparison Report

Generated from the Comparison panel, includes:
- **Cover header bar** — "Case Comparison Report"
- **Cases compared** — ECLI, title, court, date for each case
- **Comparative Summary**
- **Common Principles** (bulleted)
- **Convergence Points** (bulleted)
- **Divergence Points** (bulleted)
- **Key Differences** — per topic with each case's position
- **Legal Evolution**
- **Footer** with disclaimer and page numbers

### Technical Details

- A4 portrait format
- 20mm margins
- Helvetica font family
- Automatic page breaks
- Markdown table parsing (header row, separator detection, column width distribution)
- Alternating row backgrounds in tables
- Markdown inline formatting stripped (bold, italic, code, links)
- Cover header bar in dark navy color (#0F1E3C)
- Professional color scheme (dark headings, body text, muted footers)

---

## 16. Subscription & Plan Limits

### Plans

| Feature | Free | Pro |
|---------|------|-----|
| Active matters | 1 | Unlimited |
| Saved searches per matter | 1 (most recent) | Unlimited |
| Saved comparisons per matter | 1 (most recent) | Unlimited |
| Pinned ECLI cases | 1 | Unlimited |
| Saved documents per matter | 1 | Unlimited |
| AI chat | Available | Available |
| PDF export | Available | Available |

### Enforcement

Limits are enforced at multiple levels:

1. **Edge Function (`matter-limits`)** — checks the user's subscription plan and active matter count before allowing new matter creation. Returns `{ allowed, plan, activeCount, limit }`.
2. **Database triggers** — automatically delete older rows when free users exceed limits:
   - `enforce_search_history_limit` — keeps only the most recent search per matter for free users
   - `enforce_comparison_limit` — keeps only the most recent comparison per matter for free users
   - `enforce_ecli_pin_limit` — keeps only the most recent ECLI pin for free users
3. **Client-side UI** — shows upgrade prompts when limits are reached, displays lock icons and limit messages

### Subscription Table

The `subscriptions` table stores:
- `user_id` — links to auth user
- `plan` — "free" or "pro"
- `status` — "active" or other
- `current_period_end` — end of billing period (for Pro)

The `matter-limits` edge function checks if a Pro subscription is still active (status = "active" and period not expired). If expired, the user is treated as Free.

---

## 17. Database Schema

### Tables Overview

```
auth.users (Supabase managed)
    │
    ├── profiles (1:1)
    ├── subscriptions (1:1)
    ├── matters (1:N)
    │       ├── matter_items (1:N)
    │       ├── matter_chats (1:1)
    │       ├── matter_searches (1:N)
    │       ├── matter_comparisons (1:N)
    │       └── matter_uploads (1:N)
    ├── case_views (1:N)
    ├── ecli_case_views (1:N)
    └── ecli_pins (1:N)
```

### Table Definitions

#### `profiles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | References `auth.users(id)` ON DELETE CASCADE |
| `email` | text UNIQUE NOT NULL | User's email |
| `first_name` | text NOT NULL | First name |
| `last_name` | text NOT NULL | Last name |
| `phone` | text | Phone number |
| `created_at` | timestamptz | Default now() |
| `updated_at` | timestamptz | Auto-updated via trigger |

- **Trigger:** `handle_new_user()` — auto-creates profile on auth user creation
- **Trigger:** `handle_updated_at()` — auto-updates `updated_at`
- **RLS:** Users can SELECT and UPDATE only their own row

#### `subscriptions`

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid PK | References `auth.users(id)` ON DELETE CASCADE |
| `plan` | text NOT NULL | "free" or "pro" (default: "free") |
| `status` | text NOT NULL | "active" (default: "active") |
| `current_period_end` | timestamptz | End of billing period |

- **RLS:** Owner-scoped CRUD (4 policies)

#### `matters`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Default gen_random_uuid() |
| `user_id` | uuid NOT NULL | Default auth.uid(), references auth.users ON DELETE CASCADE |
| `title` | text NOT NULL | Matter name |
| `client_ref` | text | Client reference label |
| `jurisdiction` | text | Legal jurisdiction |
| `status` | text NOT NULL | "active" or "archived" (default: "active") |
| `created_at` | timestamptz | Default now() |
| `updated_at` | timestamptz | Auto-updated via trigger |

- **Index:** `idx_matters_user_id`
- **RLS:** Owner-scoped CRUD (4 policies using `auth.uid() = user_id`)

#### `matter_items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Default gen_random_uuid() |
| `matter_id` | uuid NOT NULL | References matters ON DELETE CASCADE |
| `type` | text NOT NULL | "case", "article", "note", "document", "timeline" |
| `ecli` | text | ECLI for case-type items |
| `article_code` | text | Article code for article-type items |
| `content` | jsonb | Flexible content payload |
| `created_at` | timestamptz | Default now() |

- **Index:** `idx_matter_items_matter_id`
- **RLS:** Scoped through parent matter (EXISTS check against matters.user_id = auth.uid())

#### `matter_chats`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Default gen_random_uuid() |
| `matter_id` | uuid NOT NULL | References matters ON DELETE CASCADE |
| `messages` | jsonb | Array of ChatMessage objects |
| `updated_at` | timestamptz | Auto-updated via trigger |

- **Index:** `idx_matter_chats_matter_id`
- **RLS:** Scoped through parent matter

#### `matter_searches`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Default gen_random_uuid() |
| `matter_id` | uuid NOT NULL | References matters ON DELETE CASCADE |
| `query` | text | Search query text |
| `filters` | jsonb | Date range, court, subject, type filters |
| `results` | jsonb NOT NULL | Array of SearchResult objects |
| `created_at` | timestamptz | Default now() |

- **Index:** `idx_matter_searches_matter_id`
- **RLS:** Scoped through parent matter
- **Trigger:** `enforce_search_history_limit` — free users: keeps only 1 most recent search per matter

#### `matter_comparisons`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Default gen_random_uuid() |
| `matter_id` | uuid NOT NULL | References matters ON DELETE CASCADE |
| `eclis` | jsonb NOT NULL | Array of ECLI strings compared |
| `result` | jsonb NOT NULL | Full CaseComparison object |
| `created_at` | timestamptz | Default now() |

- **Index:** `idx_matter_comparisons_matter_id`
- **RLS:** Scoped through parent matter
- **Trigger:** `enforce_comparison_limit` — free users: keeps only 1 most recent comparison per matter

#### `matter_uploads`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Default gen_random_uuid() |
| `matter_id` | uuid NOT NULL | References matters ON DELETE CASCADE |
| `file_name` | text NOT NULL | Original file name |
| `file_type` | text | "pdf", "docx", "text" |
| `file_size` | integer | File size in bytes |
| `text_content` | text | Extracted text (max 80,000 chars) |
| `summary` | text | AI-generated summary |
| `chat` | jsonb | Array of ChatMessage objects |
| `pinned` | boolean | Whether the document is pinned |
| `created_at` | timestamptz | Default now() |

- **Index:** `idx_matter_uploads_matter_id`
- **RLS:** Scoped through parent matter

#### `case_views`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Default gen_random_uuid() |
| `user_id` | uuid NOT NULL | Default auth.uid(), references auth.users ON DELETE CASCADE |
| `ecli` | text NOT NULL | Case identifier |
| `title` | text | Case title for display |
| `summary` | text | AI-generated summary |
| `analysis` | jsonb | Full CaseAnalysis object |
| `precedents` | jsonb | Full PrecedentAnalysis object |
| `chat` | jsonb | Array of ChatMessage objects |
| `created_at` | timestamptz | Default now() |
| `updated_at` | timestamptz | Auto-updated via trigger |

- **Unique constraint:** (user_id, ecli) — one saved view per case per user
- **Indexes:** `idx_case_views_user_id`, `idx_case_views_ecli`
- **RLS:** Owner-scoped CRUD

#### `ecli_case_views`

Same structure as `case_views` but for cases loaded via the ECLI Code panel. Has its own unique constraint on (user_id, ecli).

#### `ecli_pins`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Default gen_random_uuid() |
| `user_id` | uuid NOT NULL | Default auth.uid(), references auth.users ON DELETE CASCADE |
| `ecli` | text NOT NULL | ECLI code |
| `title` | text | Case title |
| `summary` | text | AI-generated summary |
| `analysis` | jsonb | Full CaseAnalysis object |
| `precedents` | jsonb | Full PrecedentAnalysis object |
| `chat` | jsonb | Array of ChatMessage objects |
| `created_at` | timestamptz | Default now() |

- **Unique constraint:** (user_id, ecli)
- **RLS:** Owner-scoped CRUD
- **Trigger:** `enforce_ecli_pin_limit` — free users: keeps only 1 most recent pin

### Migrations

The database schema is managed through 12 sequential migration files:

1. `20260801080027_create_profiles_table.sql` — profiles table + triggers
2. `20260801082244_add_profiles_insert_delete_policies.sql` — additional profile policies
3. `20260803073609_create_matters_and_related_tables.sql` — matters, matter_items, matter_chats, subscriptions
4. `20260803075735_add_search_comparisons_uploads_tables.sql` — matter_searches, matter_comparisons, matter_uploads
5. `20260803124107_create_case_views_table.sql` — case_views
6. `20260803132519_enforce_search_history_limit.sql` — search history limit trigger
7. `20260803140353_enforce_pinned_case_limit.sql` — pinned case limit trigger
8. `20260803143324_create_ecli_pins_table.sql` — ecli_pins table + limit trigger
9. `20260804002926_add_pinned_to_matter_uploads.sql` — add pinned column to uploads
10. `20260804085829_drop_pinned_case_limit_trigger.sql` — remove old pinned case limit
11. `20260804090649_add_case_work_columns_to_ecli_pins.sql` — add summary, analysis, precedents, chat to ecli_pins
12. `20260804131854_enforce_comparison_limit.sql` — comparison history limit trigger

---

## 18. Edge Functions

### `rechtspraak-ai`

The main Edge Function handles all Rechtspraak.nl and AI operations. It is deployed at `/functions/v1/rechtspraak-ai` and accepts POST requests with a JSON body containing an `action` field.

#### Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `search` | Search Rechtspraak.nl | query, from, to, max, type, court, subject |
| `getContent` | Fetch case content by ECLI | ecli |
| `flexibleChat` | AI chat with case context | provider, apiKey, model, messages, primaryCase |
| `summarize` | Generate AI case summary | provider, apiKey, model, caseText, ecli, metadata |
| `analyze` | Deep legal analysis | provider, apiKey, model, caseText, ecli, metadata |
| `compareCases` | Compare multiple cases | provider, apiKey, model, cases[] |
| `findSimilar` | Find similar precedents | provider, apiKey, model, caseText, ecli, metadata, searchResults[] |

#### Rechtspraak.nl Integration

The Edge Function communicates with two Rechtspraak.nl endpoints:

1. **Search:** `https://data.rechtspraak.nl/uitspraken/zoeken` — returns Atom/XML feed
2. **Content:** `https://data.rechtspraak.nl/uitspraken/content?id=<ECLI>` — returns case XML

XML parsing is done with regex:
- **Search:** extracts `<entry>` blocks, parsing title, id, updated, summary, and link
- **Content:** extracts Dublin Core metadata (`dcterms:title`, `dcterms:creator`, `dcterms:date`, etc.) and strips XML tags for plain text

#### AI Provider Handling

**Claude API:**
- Endpoint: `https://api.anthropic.com/v1/messages`
- Headers: `x-api-key`, `anthropic-version: 2023-06-01`
- System prompt sent as `system` parameter
- Messages mapped (system role → user role for Claude compatibility)

**OpenRouter API:**
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Headers: `Authorization: Bearer <key>`, `HTTP-Referer`, `X-Title`
- For **free models**: tries the requested model first, then falls back through a static list of ~20 known free models, then dynamically fetches currently available free models from the OpenRouter `/api/v1/models` endpoint and tries each one until a response is received
- For **paid models**: tries once, throws on failure

#### CORS

All responses include standard CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey
```

OPTIONS requests return 200 with CORS headers.

### `matter-limits`

A separate Edge Function at `/functions/v1/matter-limits` that checks whether the user can create a new matter.

#### How It Works

1. Receives GET request with the user's auth token
2. Creates a Supabase client with the user's token
3. Fetches the user's subscription from the `subscriptions` table
4. Checks if a Pro subscription is still active (status = "active" and period not expired)
5. Counts the user's active matters
6. Returns:
   ```json
   {
     "allowed": true/false,
     "plan": "free" | "pro",
     "activeCount": N,
     "limit": 1 | -1
   }
   ```

Free plan limit: 1 active matter. Pro plan: unlimited (limit returns -1).

---

## 19. Electron Desktop Application

### Overview

The app can be packaged as a desktop application for Windows, macOS, and Linux using Electron.

### Configuration

- **App ID:** `com.rechtspraak.ai`
- **Product name:** Rechtspraak AI
- **Window:** 1400×900px, min 1024×700px
- **Background color:** `#f8fafc` (slate-50)

### Custom Protocol

The packaged app uses a custom `app://` protocol instead of `file://` to serve the built files. This is necessary because `file://` blocks cross-origin `fetch()` calls to `https://` URLs (which the Supabase client needs). The protocol is registered as privileged with:
- `standard: true`
- `secure: true`
- `supportFetchAPI: true`
- `corsEnabled: true`

### Security

- **Context isolation:** enabled
- **Node integration:** disabled
- **Web security:** disabled (for the custom protocol to work with cross-origin requests)
- **Path traversal protection:** file paths are validated against the dist directory

### Build Targets

| Platform | Target | Output |
|----------|--------|--------|
| Windows | NSIS installer | `.exe` |
| macOS | DMG | `.dmg` |
| Linux | AppImage + DEB | `.AppImage`, `.deb` |

### Build Commands

- `npm run dist:win` — Build for Windows
- `npm run dist:mac` — Build for macOS
- `npm run dist:linux` — Build for Linux
- `npm run electron:dev` — Run in development mode (Vite dev server + Electron)

---

## 20. File Structure

```
rechtspraak-ai/
├── electron/
│   ├── main.cjs              # Electron main process (window creation, protocol)
│   └── preload.cjs           # Electron preload script
├── public/
│   ├── AskJuris_Logo.jpg     # App logo
│   ├── logo.png              # Favicon
│   └── ...                   # Other static assets
├── src/
│   ├── api.ts                # Edge function API calls (search, chat, analyze, etc.)
│   ├── mattersApi.ts         # Supabase CRUD for matters, uploads, case views, etc.
│   ├── storage.ts            # localStorage for AI config, model lists
│   ├── pdfExport.ts          # jsPDF report generation
│   ├── types.ts              # All TypeScript interfaces
│   ├── index.css             # Tailwind CSS imports
│   ├── main.tsx              # React entry point
│   ├── vite-env.d.ts         # Vite type declarations
│   ├── App.tsx               # Root component (auth routing)
│   ├── context/
│   │   └── AuthContext.tsx   # Supabase auth provider
│   ├── lib/
│   │   └── supabase.ts       # Supabase client initialization
│   └── components/
│       ├── ApiSetup.tsx           # AI provider configuration screen
│       ├── CaseAnalysisPanel.tsx  # Deep legal analysis UI
│       ├── CaseComparisonPanel.tsx # Case comparison UI
│       ├── CaseViewer.tsx         # Case viewing with tabs
│       ├── Dashboard.tsx          # Main dashboard layout
│       ├── EcliPanel.tsx          # ECLI code lookup
│       ├── EmailConfirmed.tsx     # Email confirmation landing page
│       ├── EmailVerification.tsx  # Email verification screen
│       ├── HelpPanel.tsx          # In-app help guide
│       ├── MatterWorkspace.tsx    # Matter workspace with tabs
│       ├── MattersSidebar.tsx     # Matters management sidebar
│       ├── PdfUploadPanel.tsx     # Document upload and analysis
│       ├── SearchPanel.tsx        # Rechtspraak.nl search
│       ├── SignIn.tsx             # Sign in screen
│       ├── SignUp.tsx             # Sign up screen
│       └── SimilarPrecedentsPanel.tsx # Similar precedents finder
├── supabase/
│   ├── config.toml               # Supabase configuration
│   ├── functions/
│   │   ├── rechtspraak-ai/
│   │   │   └── index.ts          # Main edge function
│   │   └── matter-limits/
│   │       └── index.ts          # Matter limit checker
│   └── migrations/
│       └── *.sql                 # 12 migration files
├── docs/
│   ├── USER_GUIDE.md             # User guide
│   └── DOCUMENTATION.md          # This file
├── scripts/
│   └── generate-docs-pdf.mjs     # Documentation PDF generator
├── index.html                    # HTML entry point
├── package.json                  # Project manifest
├── vite.config.ts                # Vite build configuration
├── tailwind.config.js            # Tailwind CSS config
├── postcss.config.js             # PostCSS config
├── tsconfig.json                 # TypeScript config (root)
├── tsconfig.app.json             # TypeScript config (app)
├── tsconfig.node.json            # TypeScript config (node)
├── eslint.config.js              # ESLint config
└── .env                          # Environment variables (Supabase URL + anon key)
```

---

## 21. Security

### Authentication

- Email/password authentication via Supabase Auth
- Email confirmation required before sign-in
- Sessions are persisted and auto-refreshed
- Password minimum length: 8 characters

### Row Level Security (RLS)

Every table has RLS enabled with owner-scoped policies:
- Direct ownership: `auth.uid() = user_id` (profiles, subscriptions, matters, case_views, ecli_pins)
- Indirect ownership via parent: `EXISTS (SELECT 1 FROM matters WHERE matters.id = <table>.matter_id AND matters.user_id = auth.uid())` (matter_items, matter_chats, matter_searches, matter_comparisons, matter_uploads)

Four separate policies per table (SELECT, INSERT, UPDATE, DELETE) — no `FOR ALL` policies.

### API Key Storage

AI provider API keys are stored in the browser's `localStorage` only. They are:
- Never sent to the app's own servers
- Sent only to the Supabase Edge Function, which forwards them to the AI provider
- The Edge Function runs in a sandboxed Deno environment

### Database Triggers

SECURITY DEFINER trigger functions enforce free-plan limits:
- `enforce_search_history_limit()` — deletes old searches for free users
- `enforce_comparison_limit()` — deletes old comparisons for free users
- `enforce_ecli_pin_limit()` — deletes old ECLI pins for free users

These triggers run AFTER INSERT and check the user's subscription plan.

### Electron Security

- Context isolation enabled
- Node integration disabled
- Path traversal prevention in the custom protocol handler
- External links opened in the system browser (not in Electron)

### Data Safety

- All foreign keys have `ON DELETE CASCADE` — deleting a user cascades to all their data
- No `DROP`, `DELETE` columns, or column type changes in migrations
- Case text is truncated (80,000 chars for general use, 40,000 for analysis, 20,000 per case in comparisons, 15,000 for precedent analysis)

---

## 22. Building & Deployment

### Prerequisites

- Node.js (with npm)
- Supabase project provisioned (URL and anon key in `.env`)

### Environment Variables

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

These are pre-populated and do not need manual configuration.

### Development

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server
npm run electron:dev  # Run with Electron (dev mode)
```

### Type Checking & Linting

```bash
npm run typecheck  # TypeScript type checking (no emit)
npm run lint       # ESLint
```

### Production Build (Web)

```bash
npm run build      # Build to dist/
```

Vite configuration:
- Base path: `./` (relative paths for Electron compatibility)
- Manual chunks: `pdfjs`, `mammoth`, `jspdf` (separate vendor chunks)
- `optimizeDeps.exclude`: `lucide-react`
- Chunk size warning limit: 1500 KB

### Desktop Builds

```bash
npm run dist:win    # Windows NSIS installer
npm run dist:mac    # macOS DMG
npm run dist:linux  # Linux AppImage + DEB
```

Output goes to `release/` directory.

### Edge Function Deployment

Edge functions are deployed via the Supabase MCP `deploy_edge_functions` tool. Each function must have a `[functions.<slug>]` table in `supabase/config.toml` with `verify_jwt` set appropriately.

---

## Appendix: TypeScript Types Reference

### Core Types

```typescript
type AIProvider = "claude" | "openrouter";

interface ApiConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

interface CaseMetadata {
  title?: string;
  creator?: string;
  date?: string;
  identifier?: string;
  subject?: string;
  zaaknummer?: string;
  summary?: string;
}

interface CaseContent {
  ecli: string;
  metadata: CaseMetadata;
  text: string;
  fullLength: number;
}

interface SearchResult {
  ecli: string;
  title: string;
  updated: string;
  summary: string;
  link: string;
  contentUrl: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
```

### Analysis Types

```typescript
interface CaseAnalysis {
  legalPrinciples: string[];
  keyArguments: KeyArgument[];
  citedLegislation: CitedLegislation[];
  referencedCases: ReferencedCase[];
  timeline: TimelineEvent[];
  outcome: string;
  legalArea: string;
  significance: string;
  rawAnalysis?: string;
}

interface CaseComparison {
  commonPrinciples: string[];
  differences: ComparisonDifference[];
  convergencePoints: string[];
  divergencePoints: string[];
  legalEvolution: string;
  comparativeSummary: string;
}

interface PrecedentAnalysis {
  similarPrecedents: SimilarPrecedent[];
  precedentSummary: string;
}
```

### Matter Types

```typescript
type MatterStatus = "active" | "archived";
type MatterItemType = "case" | "article" | "note" | "document" | "timeline";
type SubscriptionPlan = "free" | "pro";

interface Matter { id, user_id, title, client_ref, jurisdiction, status, created_at, updated_at }
interface MatterItem { id, matter_id, type, ecli, article_code, content, created_at }
interface MatterChat { id, matter_id, messages, updated_at }
interface MatterSearch { id, matter_id, query, filters, results, created_at }
interface MatterComparison { id, matter_id, eclis, result, created_at }
interface MatterUpload { id, matter_id, file_name, file_type, file_size, text_content, summary, chat, created_at, pinned }
interface CaseView { id, user_id, ecli, title, summary, analysis, precedents, chat, created_at, updated_at }
interface EcliPin { id, user_id, ecli, title, summary, analysis, precedents, chat, created_at, updated_at }
interface Subscription { user_id, plan, status, current_period_end }
```

---

*This documentation was generated from the Rechtspraak AI codebase (v1.0.0). For the user-facing guide, see `docs/USER_GUIDE.md`.*
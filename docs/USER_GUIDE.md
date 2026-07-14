# Rechtspraak AI - User Guide

A comprehensive guide to using Rechtspraak AI, an AI-powered Dutch legal research assistant for searching, analyzing, and chatting with court cases from Rechtspraak.nl.

---

## Table of Contents

1. [Installation](#1-installation)
2. [Initial Setup - Connecting an AI Provider](#2-initial-setup---connecting-an-ai-provider)
3. [Main Dashboard Overview](#3-main-dashboard-overview)
4. [Searching for Cases](#4-searching-for-cases)
5. [Loading a Case by ECLI Code](#5-loading-a-case-by-ecli-code)
6. [Uploading Your Own Documents](#6-uploading-your-own-documents)
7. [Case Viewer - AI Summary, Q&A, and Full Text](#7-case-viewer---ai-summary-qa-and-full-text)
8. [Exporting to PDF](#8-exporting-to-pdf)
9. [Settings - Changing Your AI Provider or Key](#9-settings---changing-your-ai-provider-or-key)
10. [Building as a Windows Desktop App](#10-building-as-a-windows-desktop-app)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Installation

### Requirements

- [Node.js](https://nodejs.org/) v18 or higher

### Steps

1. Download and unzip the project.
2. Open a terminal in the project folder.
3. Run `npm install` to install all dependencies.
4. Run `npm run dev` to start the development server.
5. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`).

---

## 2. Initial Setup - Connecting an AI Provider

When you first open the app, you will see the setup screen. You need to connect an AI provider to use the AI analysis features (search and case loading work without an API key).

### Choosing a Provider

The app supports two AI providers:

| Provider | Description | Where to Get a Key |
|----------|-------------|-------------------|
| **Claude API** (Anthropic) | High-quality legal analysis. Paid (with free credits for new accounts). | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **OpenRouter** | Multi-model gateway. Offers free models. | [openrouter.ai/keys](https://openrouter.ai/keys) |

### Setup Steps

1. **Select a provider** by clicking the "Claude API" or "OpenRouter" card.
2. **Enter your API key** in the field. Click "Show" to reveal it for typing.
   - Claude keys start with `sk-ant-...`
   - OpenRouter keys start with `sk-or-...`
3. **Choose a model** from the dropdown suggestions, or type any model ID manually.
   - For OpenRouter, use the `:free` suffix for free models (e.g. `qwen/qwen-2.5-72b-instruct:free`).
4. Click **Get Started**.

Your API key is stored locally in your browser. It is never sent to any server other than the AI provider you chose.

### Available Models

**Claude:**
- Claude Sonnet 4 (recommended, best quality)
- Claude 3.5 Sonnet
- Claude 3.5 Haiku (fastest, cheapest)
- Claude Opus 4 (most powerful)

**OpenRouter (free models available):**
- Llama 3.3 70B (Free)
- Gemini 2.0 Flash (Free)
- DeepSeek R1 (Free)
- Qwen 2.5 72B (Free)
- Llama 3.2 3B (Free)

---

## 3. Main Dashboard Overview

After setup, you arrive at the main dashboard. It has three main areas:

### Top Bar
- **Logo and app name** on the left
- **Active AI provider** badge (shows "Claude API" or "OpenRouter")
- **Settings button** to change your API configuration

### Left Sidebar - Three Modes

1. **Search** - Search Rechtspraak.nl for court cases with filters
2. **ECLI Code** - Load a specific case directly by its ECLI identifier
3. **Upload Document** - Upload your own legal documents for AI analysis

### Content Area
The main panel on the right changes based on which sidebar mode you select. When you open a case, the content area switches to the full Case Viewer.

---

## 4. Searching for Cases

The Search tab lets you find Dutch court cases from Rechtspraak.nl.

### Basic Search

1. Type a search query in the search bar (e.g. "opzegging huurcontract" or "onrechtmatige daad").
2. Click **Search** or press Enter.
3. Results appear below, showing up to 50 cases at a time.

Each result shows:
- The **ECLI code** (blue, monospace) - a unique identifier for the case
- The **title** of the case
- A **summary** snippet (if available)
- The **last updated date**

Click any result to open it in the Case Viewer.

### Using Filters

Click the **Filters** button to expand filter options:

| Filter | Description |
|--------|-------------|
| **From Date** | Only show cases decided on or after this date |
| **To Date** | Only show cases decided on or before this date |
| **Type** | Filter by case type: All, Uitspraak (judgment), or Conclusie (conclusion) |

Combine multiple filters to narrow your results. Click **Filters** again to collapse the panel.

### Tips
- If you get no results, try broadening your date range or removing filters.
- The search queries Rechtspraak.nl directly, so Dutch keywords work best.
- Click a result to open the full case with AI analysis tools.

---

## 5. Loading a Case by ECLI Code

If you already know the ECLI (European Case Law Identifier) of a case, you can load it directly without searching.

### Steps

1. Click **ECLI Code** in the sidebar.
2. Type or paste the ECLI code into the input field.
   - Format: `ECLI:NL:COURT:YEAR:NUMBER`
   - Example: `ECLI:NL:PHR:2023:1` or `ECLI:NL:HR:2022:1234`
3. Click **Load Case** or press Enter.

The app fetches the case from Rechtspraak.nl and opens it in the Case Viewer.

### Where to Find ECLI Codes
- In search results within the app
- On Rechtspraak.nl case pages
- In legal citations and references in other cases

---

## 6. Uploading Your Own Documents

The Upload Document tab lets you analyze your own legal documents with AI, even if they are not on Rechtspraak.nl.

### Supported File Types

| Format | Extensions |
|--------|-----------|
| PDF | `.pdf` |
| Word | `.docx`, `.doc` |
| Text | `.txt`, `.md`, `.rtf` |

### How to Upload

**Option A - Drag and Drop:**
1. Drag a file from your file explorer onto the dashed upload area.
2. The app reads the file automatically.

**Option B - Browse:**
1. Click **Browse Files**.
2. Select a file from the file dialog.

### After Upload

Once the file is read, you see:
- The **filename** and file size
- The number of **characters extracted** from the document
- Two action buttons: **Export PDF** and **Upload New**

You can now:
- **Generate an AI Summary** - Click the "Generate AI Summary" button for a structured summary
- **Ask questions** - Type any question about the document in the chat input at the bottom
- **Use suggestion chips** - Quick-start questions like "Summarize this document" or "What are the key points?"

### Limitations
- Documents are truncated to 80,000 characters for AI processing.
- Scanned PDFs without a text layer cannot be read (the app needs selectable text).
- The extracted text is processed by AI but is not stored on any server.

---

## 7. Case Viewer - AI Summary, Q&A, and Full Text

When you open a case (from search results or ECLI input), the Case Viewer appears with three tabs:

### Case Header

The top of the Case Viewer shows:
- **Back button** to return to the previous screen
- The **ECLI code** badge
- The **case title**
- **Metadata**: court name, date, case number, and subject
- **Export PDF** button

### Tab 1: AI Summary

Generates a structured AI analysis of the case.

1. Click **Generate Summary**.
2. Wait a few seconds while the AI analyzes the case.
3. The summary appears with structured sections covering key facts, arguments, and ruling.
4. Click **Regenerate Summary** if you want a fresh analysis.

### Tab 2: Ask Questions

An interactive chat where you can ask the AI anything about the case.

**Features:**
- Type your question in the input field at the bottom and press Enter or click the send button.
- The AI has the full case text as context and answers based on it.
- **ECLI references in your questions** are automatically fetched and analyzed. For example, if you ask "Compare this with ECLI:NL:RBDHA:2023:1234", the AI will fetch that case too.
- When the AI fetches referenced cases, a note appears showing which cases were analyzed.
- Suggested questions appear when the chat is empty to help you get started:
  - "What is this case about?"
  - "What was the court's decision?"
  - "Compare this with ECLI:NL:RBDHA:2023:1234"
  - "What are similar cases to this one?"
  - "Explain the legal reasoning"
  - "Draft a case note for this ruling"

### Tab 3: Case Text

Displays the full, raw text of the court case as retrieved from Rechtspraak.nl.

- Shows the total character count.
- The text is displayed in a scrollable container.
- Use this to read the original ruling without AI interpretation.

---

## 8. Exporting to PDF

Both the Case Viewer and the Upload Document panel support exporting to PDF.

### What Gets Exported

The PDF report includes:
1. **Header bar** with "Legal Case Analysis Report" and generation date
2. **Case title** and metadata (ECLI, court, date, case number, subject)
3. **AI Summary** (if one has been generated)
4. **Q&A conversation** (all questions and answers from the chat)
5. **Case text** (first 6,000 characters, with a note if truncated)
6. **Footer** on every page: "For informational purposes only. Does not constitute legal advice." with page numbers.

### How to Export

**From the Case Viewer:**
- Click the **Export PDF** button in the top-right corner.

**From the Upload Document panel:**
- Click the **Export PDF** button in the file header area.

The PDF downloads immediately to your browser's default download location. The filename is based on the case title or document name.

---

## 9. Settings - Changing Your AI Provider or Key

To change your AI provider, model, or API key after initial setup:

1. Click **Settings** in the top-right corner of the dashboard.
2. The setup screen reappears with your current configuration pre-filled.
3. Change the provider, API key, or model as needed.
4. Click **Save Settings** to apply changes.
5. Click **Cancel** to go back without changing anything.

Your API key is stored in your browser's local storage. To clear it entirely, you would need to clear your browser's local storage for the site.

---

## 10. Building as a Windows Desktop App

You can package the app as a standalone Windows installer.

### Prerequisites

- Node.js v18+ installed on a Windows machine
- The project downloaded and unzipped

### Steps

1. Open a terminal in the project folder.
2. Run `npm install` to install dependencies.
3. Run `npm run dist:win` to build the installer.
4. Find the installer in the `release/` folder:
   - `Rechtspraak AI Setup 1.0.0.exe` - The NSIS installer

### What the Installer Does

The installer creates a Windows application that:
- Installs to a directory you choose (default: Program Files)
- Creates a desktop shortcut
- Creates a Start Menu shortcut
- Runs as a standalone desktop app (no browser needed)
- Shows "Leronegroup" as the publisher name

### Other Platforms

| Command | Output |
|---------|--------|
| `npm run dist:win` | Windows NSIS installer (.exe) |
| `npm run dist:mac` | macOS DMG file |
| `npm run dist:linux` | Linux AppImage and .deb package |

### Development Mode

To run the app as a desktop app with hot reload during development:
```
npm run electron:dev
```

---

## 11. Troubleshooting

### Search returns no results
- Try broader Dutch keywords.
- Remove date filters.
- Rechtspraak.nl may be temporarily unavailable. Try again later.

### "Failed to fetch case" error
- Verify the ECLI code is correct and complete (e.g. `ECLI:NL:PHR:2023:1`).
- Check your internet connection.
- The case may not be publicly available.

### AI features not working
- Verify your API key is correct in Settings.
- For Claude: ensure your key starts with `sk-ant-` and has credits available.
- For OpenRouter: ensure your key is valid and the model name is correct.
- Check your internet connection.
- Free OpenRouter models may have rate limits. Try again or switch to a different model.

### "Could not extract any text from this file"
- The file may be a scanned PDF without a text layer. Use a PDF with selectable text.
- The file may be empty or corrupted. Try a different file.
- For Word documents, ensure they are `.docx` or `.doc` format.

### PDF export is missing content
- Generate an AI summary first - it is included in the export.
- Ask questions in the chat first - the conversation is included in the export.
- Case text is truncated to 6,000 characters in the PDF for readability.

### Windows "Unknown Publisher" warning
- This is normal for unsigned applications. Click "More info" then "Run anyway" to proceed.
- The publisher name is set to "Leronegroup" but the executable is not digitally signed.
- To fully remove the warning, you would need a code signing certificate from a certificate authority (DigiCert, Sectigo, etc.).

### App runs but page is blank
- Make sure you completed the initial API setup screen.
- Try clearing your browser local storage and refreshing.
- Check the browser console for errors (F12 > Console).

---

## Privacy and Data Handling

- Your **API key** is stored locally in your browser and never sent to any third-party server.
- **Case text** from Rechtspraak.nl is fetched on-demand and not stored.
- **Uploaded documents** are processed in-memory and not persisted.
- **Chat messages** are sent to your chosen AI provider (Claude or OpenRouter) for processing.
- The app uses a Supabase Edge Function as a proxy to Rechtspraak.nl and the AI providers.

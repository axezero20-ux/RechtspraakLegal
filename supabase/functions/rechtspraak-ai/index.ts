import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ── XML text extraction helpers ──────────────────────────────────────────────

function extractTextFromXML(xml: string): string {
  let text = xml.replace(/<\?[^>]*\?>/g, "");
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function extractMetadataFromXML(xml: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const titleMatch = xml.match(/<dcterms:title[^>]*>(.*?)<\/dcterms:title>/s);
  if (titleMatch) meta.title = titleMatch[1].trim();
  const creatorMatch = xml.match(/<dcterms:creator[^>]*>(.*?)<\/dcterms:creator>/s);
  if (creatorMatch) meta.creator = creatorMatch[1].trim();
  const dateMatch = xml.match(/<dcterms:date[^>]*>(.*?)<\/dcterms:date>/s);
  if (dateMatch) meta.date = dateMatch[1].trim();
  const idMatch = xml.match(/<dcterms:identifier[^>]*>(.*?)<\/dcterms:identifier>/s);
  if (idMatch) meta.identifier = idMatch[1].trim();
  const subjectMatch = xml.match(/<dcterms:subject[^>]*>(.*?)<\/dcterms:subject>/s);
  if (subjectMatch) meta.subject = subjectMatch[1].trim();
  const zaakMatch = xml.match(/<psi:zaaknummer[^>]*>(.*?)<\/psi:zaaknummer>/s);
  if (zaakMatch) meta.zaaknummer = zaakMatch[1].trim();
  const summaryMatch = xml.match(/<summary[^>]*>(.*?)<\/summary>/s);
  if (summaryMatch) meta.summary = summaryMatch[1].trim();
  return meta;
}

// ── Rechtspraak search ───────────────────────────────────────────────────────

// Map of court ECLI codes to their full Dutch names (for display/filtering)
const COURT_CODES: Record<string, string> = {
  "HR": "Hoge Raad",
  "GHAMS": "Gerechtshof Amsterdam",
  "GHDHA": "Gerechtshof Den Haag",
  "GHARL": "Gerechtshof Arnhem-Leeuwarden",
  "GHSHE": "Gerechtshof 's-Hertogenbosch",
  "RBAMS": "Rechtbank Amsterdam",
  "RBDHA": "Rechtbank Den Haag",
  "RBROT": "Rechtbank Rotterdam",
  "RBMNE": "Rechtbank Midden-Nederland",
  "RBLIM": "Rechtbank Limburg",
  "RBGEL": "Rechtbank Gelderland",
  "RBOVE": "Rechtbank Overijssel",
  "RBNHO": "Rechtbank Noord-Holland",
  "RBNNE": "Rechtbank Noord-Nederland",
  "RBARN": "Rechtbank Arnhem",
  "RBZWB": "Rechtbank Zeeland-West-Brabant",
  "RBSGR": "Rechtbank 's-Gravenhage",
  "RBLEE": "Rechtbank Leeuwarden",
  "RVS": "Raad van State",
  "CRVB": "Centrale Raad van Beroep",
  "CBB": "College van Beroep voor het bedrijfsleven",
};

// Extract court code from ECLI (e.g. "ECLI:NL:HR:2024:123" -> "HR")
function courtCodeFromEcli(ecli: string): string {
  const parts = ecli.split(":");
  return parts.length >= 3 ? parts[2] : "";
}

// Extract date from ECLI (e.g. "ECLI:NL:HR:2024:123" -> "2024")
function yearFromEcli(ecli: string): string {
  const parts = ecli.split(":");
  return parts.length >= 4 ? parts[3] : "";
}

async function searchRechtspraak(params: {
  query?: string;
  from?: string;
  to?: string;
  max?: number;
  type?: string;
  court?: string;
  subject?: string;
}): Promise<unknown> {
  const searchUrl = new URL("https://data.rechtspraak.nl/uitspraken/zoeken");

  // The Rechtspraak API only supports: max, from (offset), sort, date (exact),
  // type (Uitspraak/Conclusie), and return. Court and subject filters are not
  // natively supported, so we fetch a larger batch and filter server-side.

  const needsCourtFilter = !!params.court;
  const needsDateRangeFilter = !!(params.from || params.to);
  const needsSubjectFilter = !!params.subject;
  const needsTextFilter = !!params.query && params.query.trim().length > 0;

  // When filtering server-side, fetch more results to have enough after filtering
  const fetchMax = needsCourtFilter || needsDateRangeFilter || needsSubjectFilter || needsTextFilter
    ? Math.min((params.max || 50) * 10, 1000)
    : params.max || 50;

  const searchParams: string[][] = [];
  searchParams.push(["max", String(fetchMax)]);
  searchParams.push(["from", "0"]);
  searchParams.push(["sort", "DESC"]);

  if (params.type) {
    searchParams.push(["type", params.type]);
  }
  // If only a single exact date is provided (no range), use the API's date param
  if (params.from && params.to && params.from === params.to) {
    searchParams.push(["date", params.from]);
  }
  searchParams.push(["return", "DOC"]);

  const url = `${searchUrl.toString()}?${new URLSearchParams(searchParams).toString()}`;

  const response = await fetch(url, {
    headers: { Accept: "application/xml" },
  });

  if (!response.ok) {
    throw new Error(`Rechtspraak search failed: ${response.status}`);
  }

  const xml = await response.text();

  // Extract total count from subtitle
  const subtitleMatch = xml.match(/<subtitle[^>]*>Aantal gevonden ECLI's:\s*(\d+)<\/subtitle>/);
  const totalAvailable = subtitleMatch ? parseInt(subtitleMatch[1], 10) : 0;

  const entries: unknown[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    const titleMatch = entryXml.match(/<title[^>]*>(.*?)<\/title>/s);
    const idMatch = entryXml.match(/<id[^>]*>(.*?)<\/id>/s);
    const updatedMatch = entryXml.match(/<updated[^>]*>(.*?)<\/updated>/s);
    const summaryMatch = entryXml.match(/<summary[^>]*>(.*?)<\/summary>/s);
    const linkMatch = entryXml.match(/<link[^>]*href="([^"]*)"[^>]*>/);

    const ecli = idMatch ? idMatch[1].trim().replace(/^.*\//, "") : "";
    const title = titleMatch ? titleMatch[1].trim() : "";

    entries.push({
      ecli,
      title,
      updated: updatedMatch ? updatedMatch[1].trim() : "",
      summary: summaryMatch ? summaryMatch[1].trim() : "",
      link: linkMatch ? linkMatch[1] : "",
      contentUrl: `https://data.rechtspraak.nl/uitspraken/content?id=${ecli}`,
    });
  }

  // ── Server-side filtering (for params the API doesn't natively support) ──

  let filtered = entries;

  // Court filter: match by ECLI court code prefix
  if (needsCourtFilter) {
    const courtCode = params.court!;
    filtered = filtered.filter((e: any) => {
      const code = courtCodeFromEcli(e.ecli);
      return code === courtCode;
    });
  }

  // Date range filter: parse date from the title or ECLI year
  if (needsDateRangeFilter) {
    const fromDate = params.from ? new Date(params.from) : null;
    const toDate = params.to ? new Date(params.to) : null;
    filtered = filtered.filter((e: any) => {
      // Try to extract date from title (format: "..., DD-MM-YYYY, ...")
      const dateMatch = e.title.match(/(\d{2})-(\d{2})-(\d{4})/);
      let caseDate: Date | null = null;
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        caseDate = new Date(`${year}-${month}-${day}`);
      } else {
        // Fall back to ECLI year
        const year = yearFromEcli(e.ecli);
        if (year) caseDate = new Date(`${year}-01-01`);
      }
      if (!caseDate) return true; // keep if we can't parse
      if (fromDate && caseDate < fromDate) return false;
      if (toDate && caseDate > new Date(toDate.getTime() + 86400000)) return false; // inclusive end date
      return true;
    });
  }

  // Subject filter: match by keyword in title or summary
  if (needsSubjectFilter) {
    const subject = params.subject!.toLowerCase();
    filtered = filtered.filter((e: any) => {
      const text = `${e.title} ${e.summary}`.toLowerCase();
      return text.includes(subject);
    });
  }

  // Text query filter: match by keyword in title or summary
  if (needsTextFilter) {
    const query = params.query!.trim().toLowerCase();
    filtered = filtered.filter((e: any) => {
      const text = `${e.title} ${e.summary}`.toLowerCase();
      return text.includes(query);
    });
  }

  // Trim to requested max
  const maxResults = params.max || 50;
  const trimmed = filtered.slice(0, maxResults);

  return {
    results: trimmed,
    total: trimmed.length,
    totalAvailable,
    filteredFrom: entries.length,
  };
}

// ── Get case content by ECLI ─────────────────────────────────────────────────

async function getCaseContent(ecli: string): Promise<unknown> {
  const url = `https://data.rechtspraak.nl/uitspraken/content?id=${encodeURIComponent(ecli)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/xml" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch case content: ${response.status}`);
  }

  const xml = await response.text();
  const metadata = extractMetadataFromXML(xml);
  const text = extractTextFromXML(xml);

  const truncated = text.length > 80000 ? text.substring(0, 80000) + "..." : text;

  return {
    ecli,
    metadata,
    text: truncated,
    fullLength: text.length,
  };
}

// ── AI Chat (Claude / OpenRouter) ────────────────────────────────────────────

async function callAI(params: {
  provider: "claude" | "openrouter";
  apiKey: string;
  model?: string;
  messages: { role: string; content: string }[];
  systemPrompt?: string;
  maxTokens?: number;
}): Promise<string> {
  const { provider, apiKey, messages, systemPrompt, model, maxTokens } = params;

  if (provider === "claude") {
    const claudeMessages = messages.map((m) => ({
      role: m.role === "system" ? "user" : m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      model: model || "claude-sonnet-4-20250514",
      max_tokens: maxTokens || 4096,
      messages: claudeMessages,
    };
    if (systemPrompt) body.system = systemPrompt;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || "No response from Claude.";
  } else {
    const requestedModel = model || "meta-llama/llama-3.3-70b-instruct:free";
    const isFreeModel = requestedModel.includes(":free");

    const freeFallbacks = [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
      "deepseek/deepseek-r1:free",
      "qwen/qwen-2.5-72b-instruct:free",
      "meta-llama/llama-3.2-3b-instruct:free",
    ];

    const modelsToTry = isFreeModel
      ? [requestedModel, ...freeFallbacks.filter((m) => m !== requestedModel)]
      : [requestedModel];

    let lastError = "";

    for (const modelId of modelsToTry) {
      const body: Record<string, unknown> = {
        model: modelId,
        messages: systemPrompt
          ? [{ role: "system", content: systemPrompt }, ...messages]
          : messages,
        max_tokens: maxTokens ?? (modelId.includes(":free") ? 2000 : 4096),
      };

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://rechtspraak-ai.app",
          "X-Title": "Rechtspraak AI Assistant",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          if (modelId !== requestedModel) {
            return `${content}\n\n_(Fallback model used: ${modelId} — requested model was temporarily unavailable)_`;
          }
          return content;
        }
      }

      const errText = await response.text();
      let errMessage = `OpenRouter API error (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) errMessage += `: ${errJson.error.message}`;
      } catch {
        if (errText) errMessage += `: ${errText.substring(0, 200)}`;
      }
      lastError = errMessage;

      const isAvailabilityError =
        response.status === 404 ||
        response.status === 429 ||
        response.status === 503 ||
        errMessage.toLowerCase().includes("unavailable") ||
        errMessage.toLowerCase().includes("not available") ||
        errMessage.toLowerCase().includes("no providers") ||
        errMessage.toLowerCase().includes("provider returned error") ||
        errMessage.toLowerCase().includes("rate limit");

      if (!isFreeModel || !isAvailabilityError) {
        throw new Error(errMessage);
      }
    }

    throw new Error(
      `All free models were temporarily unavailable. Last error: ${lastError}. Try again later or use a paid model.`
    );
  }
}

// ── Deep case analysis ──────────────────────────────────────────────────────

async function analyzeCase(params: {
  provider: "claude" | "openrouter";
  apiKey: string;
  model?: string;
  caseText: string;
  ecli: string;
  metadata: Record<string, string>;
}): Promise<unknown> {
  const { provider, apiKey, model, caseText, ecli, metadata } = params;
  const truncatedText = caseText.substring(0, 40000);

  const systemPrompt = `You are an expert legal analyst specializing in Dutch law (Rechtspraak). You provide structured, thorough legal analysis. Always respond in valid JSON format unless asked otherwise. Respond in the same language as the case, defaulting to English if unclear.`;

  const userMessage = `Analyze the following Dutch court ruling and extract structured legal information. Return ONLY valid JSON (no markdown, no code fences) with this exact structure:

{
  "legalPrinciples": ["key legal principles established or applied"],
  "keyArguments": [
    { "party": "who made the argument", "argument": "the argument", "outcome": "accepted/rejected/partially accepted" }
  ],
  "citedLegislation": [
    { "title": "name of the law/act", "articles": ["article numbers"], "relevance": "how it applies" }
  ],
  "referencedCases": [
    { "ecli": "ECLI if available", "title": "case title or reference", "how": "how it was used" }
  ],
  "timeline": [
    { "date": "date or description", "event": "what happened" }
  ],
  "outcome": "summary of the final ruling",
  "legalArea": "area of law (e.g. civil, criminal, administrative, labor)",
  "significance": "why this case is legally significant"
}

Case details:
ECLI: ${ecli}
${metadata?.title ? `Title: ${metadata.title}` : ""}
${metadata?.creator ? `Court: ${metadata.creator}` : ""}
${metadata?.date ? `Date: ${metadata.date}` : ""}

Case text:
${truncatedText}`;

  const result = await callAI({
    provider,
    apiKey,
    model,
    messages: [{ role: "user", content: userMessage }],
    systemPrompt,
    maxTokens: 4096,
  });

  try {
    const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { rawAnalysis: result };
  }
}

// ── Compare multiple cases ──────────────────────────────────────────────────

async function compareCases(params: {
  provider: "claude" | "openrouter";
  apiKey: string;
  model?: string;
  cases: { ecli: string; text: string; metadata: Record<string, string> }[];
}): Promise<unknown> {
  const { provider, apiKey, model, cases } = params;

  let contextBlock = "";
  for (const c of cases) {
    contextBlock += `=== CASE: ${c.ecli} ===\n`;
    if (c.metadata?.title) contextBlock += `Title: ${c.metadata.title}\n`;
    if (c.metadata?.creator) contextBlock += `Court: ${c.metadata.creator}\n`;
    if (c.metadata?.date) contextBlock += `Date: ${c.metadata.date}\n`;
    contextBlock += `Text: ${c.text.substring(0, 20000)}\n\n`;
  }

  const systemPrompt = `You are an expert legal analyst specializing in Dutch law (Rechtspraak). You compare court cases and identify similarities, differences, and legal patterns. Always respond in valid JSON format. Respond in English unless the cases are clearly in another language.`;

  const userMessage = `Compare the following ${cases.length} Dutch court rulings. Return ONLY valid JSON (no markdown, no code fences) with this exact structure:

{
  "commonPrinciples": ["legal principles shared across all or most cases"],
  "differences": [
    {
      "topic": "the topic of difference",
      "positions": [
        { "ecli": "case ECLI", "position": "how this case approaches the topic" }
      ]
    }
  ],
  "convergencePoints": ["where the cases agree or converge"],
  "divergencePoints": ["where the cases disagree or diverge"],
  "legalEvolution": "how the law has evolved across these cases if they span different time periods",
  "comparativeSummary": "overall comparison summary"
}

Cases to compare:

${contextBlock}`;

  const result = await callAI({
    provider,
    apiKey,
    model,
    messages: [{ role: "user", content: userMessage }],
    systemPrompt,
    maxTokens: 4096,
  });

  try {
    const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { rawAnalysis: result };
  }
}

// ── Find similar precedents ──────────────────────────────────────────────────

async function findSimilarPrecedents(params: {
  provider: "claude" | "openrouter";
  apiKey: string;
  model?: string;
  caseText: string;
  ecli: string;
  metadata: Record<string, string>;
  searchResults: { ecli: string; title: string; summary: string }[];
}): Promise<unknown> {
  const { provider, apiKey, model, caseText, ecli, metadata, searchResults } = params;

  const candidateList = searchResults
    .filter((r) => r.ecli !== ecli)
    .slice(0, 20)
    .map((r, i) => `${i + 1}. ECLI: ${r.ecli}\n   Title: ${r.title}\n   Summary: ${r.summary || "N/A"}`)
    .join("\n\n");

  const systemPrompt = `You are an expert legal analyst specializing in Dutch law (Rechtspraak). You identify similar precedents and explain their relevance. Always respond in valid JSON format. Respond in English.`;

  const userMessage = `Given the primary case below and a list of candidate cases from Rechtspraak.nl, identify which candidates are most similar as precedents. Return ONLY valid JSON (no markdown, no code fences) with this exact structure:

{
  "similarPrecedents": [
    {
      "ecli": "candidate ECLI",
      "title": "candidate title",
      "similarity": "high/medium/low",
      "reason": "why this case is similar",
      "sharedPrinciples": ["shared legal principles"],
      "keyDifference": "main difference from the primary case"
    }
  ],
  "precedentSummary": "overall analysis of precedent relationships"
}

Primary case:
ECLI: ${ecli}
${metadata?.title ? `Title: ${metadata.title}` : ""}
${metadata?.creator ? `Court: ${metadata.creator}` : ""}
${metadata?.subject ? `Subject: ${metadata.subject}` : ""}
Text (excerpt): ${caseText.substring(0, 15000)}

Candidate cases:
${candidateList}`;

  const result = await callAI({
    provider,
    apiKey,
    model,
    messages: [{ role: "user", content: userMessage }],
    systemPrompt,
    maxTokens: 4096,
  });

  try {
    const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { rawAnalysis: result };
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();

    switch (action) {
      case "search": {
        const result = await searchRechtspraak(payload);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "getContent": {
        const result = await getCaseContent(payload.ecli);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "chat": {
        const result = await callAI(payload);
        return new Response(JSON.stringify({ response: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "flexibleChat": {
        const {
          provider, apiKey, model, messages,
          primaryCase, additionalECLIs,
        } = payload;

        const ecliPattern = /ECLI:[A-Z]{2}:[A-Z]+:[0-9]{4}:[A-Z0-9]+/g;
        const allText = messages.map((m: { content: string }) => m.content).join(" ");
        const mentionedECLIs = new Set<string>(additionalECLIs || []);
        for (const m of allText.matchAll(ecliPattern)) {
          mentionedECLIs.add(m[0]);
        }
        if (primaryCase?.ecli) mentionedECLIs.delete(primaryCase.ecli);

        const fetchedCases: { ecli: string; text: string }[] = [];
        for (const ecli of mentionedECLIs) {
          if (fetchedCases.length >= 5) break;
          try {
            const content = await getCaseContent(ecli) as { ecli: string; text: string; metadata: Record<string, string> };
            fetchedCases.push({
              ecli,
              text: content.text.substring(0, 30000),
            });
          } catch {
            // skip cases that can't be fetched
          }
        }

        let contextBlock = "";
        if (primaryCase?.text) {
          contextBlock += `=== PRIMARY CASE: ${primaryCase.ecli} ===\n${primaryCase.text.substring(0, 40000)}\n\n`;
        }
        for (const c of fetchedCases) {
          contextBlock += `=== REFERENCED CASE: ${c.ecli} ===\n${c.text}\n\n`;
        }

        const systemPrompt = `You are a flexible legal assistant specializing in Dutch law (Rechtspraak). You have access to the full text of court cases provided below. You can answer any question — case analysis, legal reasoning, comparisons between cases, general legal questions, drafting tasks, and more. Do not restrict yourself to only the current case; if the user references or compares other cases, use the provided context. If the user asks about a case that is not in the context, say so and answer from your general knowledge. Respond in the same language as the user's question, defaulting to English.

IMPORTANT FORMATTING RULE: Every response MUST begin with a top-level heading (using a single #) that summarizes the answer's topic, followed by the body of your answer. When presenting structured or comparative information, use GitHub-flavored markdown tables. Use tables for comparisons, lists of items with multiple attributes, timelines, or any data that fits a row/column structure. Use bullet lists only when a single-column list is more appropriate than a table.

${contextBlock}`;

        const result = await callAI({
          provider,
          apiKey,
          model,
          messages,
          systemPrompt,
          maxTokens: 4096,
        });
        return new Response(
          JSON.stringify({ response: result, fetchedECLIs: fetchedCases.map((c) => c.ecli) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      case "summarize": {
        const { provider, apiKey, model, caseText, ecli, metadata } = payload;
        const systemPrompt =
          "You are a legal assistant specializing in Dutch law (Rechtspraak). Provide clear, accurate summaries of Dutch court rulings. Always respond in the same language as the user's question, defaulting to English if unclear.";
        const truncatedText = caseText.substring(0, 30000);
        const userMessage = `Please provide a comprehensive summary of the following Dutch court ruling.\n\nECLI: ${ecli}\n${metadata?.title ? `Title: ${metadata.title}\n` : ""}${metadata?.creator ? `Court: ${metadata.creator}\n` : ""}${metadata?.date ? `Date: ${metadata.date}\n` : ""}\n\nCase text:\n${truncatedText}\n\nPlease structure your summary with these sections:\n1. Case Overview\n2. Key Facts\n3. Legal Issues\n4. Court's Decision\n5. Legal Reasoning\n6. Significance`;
        const result = await callAI({
          provider,
          apiKey,
          model,
          messages: [{ role: "user", content: userMessage }],
          systemPrompt,
          maxTokens: 4000,
        });
        return new Response(JSON.stringify({ response: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "analyze": {
        const result = await analyzeCase(payload);
        return new Response(JSON.stringify({ analysis: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "compareCases": {
        const result = await compareCases(payload);
        return new Response(JSON.stringify({ comparison: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "findSimilar": {
        const result = await findSimilarPrecedents(payload);
        return new Response(JSON.stringify({ precedents: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

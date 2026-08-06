import type {
  ApiConfig,
  CaseAnalysis,
  CaseComparison,
  CaseContent,
  ChatMessage,
  PrecedentAnalysis,
  SearchResult,
} from "./types";

const SUPABASE_URL = "https://hormtmwyckjiaxalonum.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvcm10bXd5Y2tqaWF4YWxvbnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjU4NjMsImV4cCI6MjEwMTE0MTg2M30.KiSDEU-sTobgNV7D0QUwEOwItJxALpNMlRs7UBezpl4";

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/rechtspraak-ai`;
const HEADERS = {
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

export async function searchRechtspraak(params: {
  query?: string;
  from?: string;
  to?: string;
  max?: number;
  type?: string;
  court?: string;
  subject?: string;
}): Promise<{ results: SearchResult[]; total: number }> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ action: "search", ...params }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Search failed" }));
    throw new Error(err.error || `Search failed (${response.status})`);
  }
  return response.json();
}

export async function getCaseContent(ecli: string): Promise<CaseContent> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ action: "getContent", ecli }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Failed to fetch case" }));
    throw new Error(err.error || `Failed to fetch case (${response.status})`);
  }
  return response.json();
}

export async function flexibleChat(
  config: ApiConfig,
  messages: ChatMessage[],
  primaryCase?: { ecli: string; text: string },
): Promise<{ response: string; fetchedECLIs: string[] }> {
  const apiMessages = messages.map((m) => ({ role: m.role, content: m.content }));

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      action: "flexibleChat",
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      messages: apiMessages,
      primaryCase: primaryCase ? { ecli: primaryCase.ecli, text: primaryCase.text } : undefined,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "AI request failed" }));
    throw new Error(err.error || `AI request failed (${response.status})`);
  }
  const data = await response.json();
  return { response: data.response, fetchedECLIs: data.fetchedECLIs || [] };
}

export async function summarizeCase(
  config: ApiConfig,
  caseContent: CaseContent,
): Promise<string> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      action: "summarize",
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      caseText: caseContent.text,
      ecli: caseContent.ecli,
      metadata: caseContent.metadata,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Summarize failed" }));
    throw new Error(err.error || `Summarize failed (${response.status})`);
  }
  const data = await response.json();
  return data.response;
}

// ── Stage 2: Legal Analysis API ──────────────────────────────────────────────

export async function analyzeCase(
  config: ApiConfig,
  caseContent: CaseContent,
): Promise<CaseAnalysis> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      action: "analyze",
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      caseText: caseContent.text,
      ecli: caseContent.ecli,
      metadata: caseContent.metadata,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Analysis failed" }));
    throw new Error(err.error || `Analysis failed (${response.status})`);
  }
  const data = await response.json();
  return data.analysis as CaseAnalysis;
}

export async function compareCases(
  config: ApiConfig,
  cases: { ecli: string; text: string; metadata: Record<string, string> }[],
): Promise<CaseComparison> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      action: "compareCases",
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      cases,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Comparison failed" }));
    throw new Error(err.error || `Comparison failed (${response.status})`);
  }
  const data = await response.json();
  return data.comparison as CaseComparison;
}

export async function findSimilarPrecedents(
  config: ApiConfig,
  caseContent: CaseContent,
  searchResults: SearchResult[],
): Promise<PrecedentAnalysis> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      action: "findSimilar",
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      caseText: caseContent.text,
      ecli: caseContent.ecli,
      metadata: caseContent.metadata,
      searchResults: searchResults.map((r) => ({
        ecli: r.ecli,
        title: r.title,
        summary: r.summary,
      })),
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Precedent search failed" }));
    throw new Error(err.error || `Precedent search failed (${response.status})`);
  }
  const data = await response.json();
  return data.precedents as PrecedentAnalysis;
}

import type { ApiConfig, CaseContent, ChatMessage } from "./types";

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rechtspraak-ai`;
const HEADERS = {
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

export async function searchRechtspraak(params: {
  query?: string;
  from?: string;
  to?: string;
  max?: number;
  type?: string;
  court?: string;
}): Promise<{ results: import("./types").SearchResult[]; total: number }> {
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

export async function chatWithAI(
  config: ApiConfig,
  messages: ChatMessage[],
  caseContext?: { ecli: string; text: string },
): Promise<string> {
  const systemPrompt = caseContext
    ? `You are a legal assistant specializing in Dutch law (Rechtspraak). The user is asking questions about a specific court case with ECLI: ${caseContext.ecli}. Here is the case text:\n\n${caseContext.text.substring(0, 60000)}\n\nAnswer questions based on this case. If the question is outside the scope of this case, say so. Respond in the same language as the user's question, defaulting to English.`
    : "You are a legal assistant specializing in Dutch law (Rechtspraak). Respond in the same language as the user's question, defaulting to English.";

  const apiMessages = messages.map((m) => ({ role: m.role, content: m.content }));

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      action: "chat",
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      messages: apiMessages,
      systemPrompt,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "AI request failed" }));
    throw new Error(err.error || `AI request failed (${response.status})`);
  }
  const data = await response.json();
  return data.response;
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

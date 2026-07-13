import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ── XML text extraction helpers ──────────────────────────────────────────────

function extractTextFromXML(xml: string): string {
  // Remove XML declaration and processing instructions
  let text = xml.replace(/<\?[^>]*\?>/g, "");
  // Remove all XML tags but keep their text content
  text = text.replace(/<[^>]+>/g, " ");
  // Decode common XML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function extractMetadataFromXML(xml: string): Record<string, string> {
  const meta: Record<string, string> = {};
  // Extract title
  const titleMatch = xml.match(/<dcterms:title[^>]*>(.*?)<\/dcterms:title>/s);
  if (titleMatch) meta.title = titleMatch[1].trim();
  // Extract creator (court)
  const creatorMatch = xml.match(/<dcterms:creator[^>]*>(.*?)<\/dcterms:creator>/s);
  if (creatorMatch) meta.creator = creatorMatch[1].trim();
  // Extract date
  const dateMatch = xml.match(/<dcterms:date[^>]*>(.*?)<\/dcterms:date>/s);
  if (dateMatch) meta.date = dateMatch[1].trim();
  // Extract identifier (ECLI)
  const idMatch = xml.match(/<dcterms:identifier[^>]*>(.*?)<\/dcterms:identifier>/s);
  if (idMatch) meta.identifier = idMatch[1].trim();
  // Extract subject
  const subjectMatch = xml.match(/<dcterms:subject[^>]*>(.*?)<\/dcterms:subject>/s);
  if (subjectMatch) meta.subject = subjectMatch[1].trim();
  // Extract zaaknummer
  const zaakMatch = xml.match(/<psi:zaaknummer[^>]*>(.*?)<\/psi:zaaknummer>/s);
  if (zaakMatch) meta.zaaknummer = zaakMatch[1].trim();
  // Extract summary
  const summaryMatch = xml.match(/<summary[^>]*>(.*?)<\/summary>/s);
  if (summaryMatch) meta.summary = summaryMatch[1].trim();
  return meta;
}

// ── Rechtspraak search ───────────────────────────────────────────────────────

async function searchRechtspraak(params: {
  query?: string;
  from?: string;
  to?: string;
  max?: number;
  type?: string;
  court?: string;
}): Promise<unknown> {
  // Use the official Open Data API for structured search
  const searchUrl = new URL("https://data.rechtspraak.nl/uitspraken/zoeken");

  const searchParams: string[][] = [];
  searchParams.push(["max", String(params.max || 50)]);
  searchParams.push(["from", "0"]);
  searchParams.push(["sort", "DESC"]);

  if (params.type) {
    searchParams.push(["type", params.type]);
  }
  if (params.from) {
    searchParams.push(["date", params.from]);
  }
  if (params.to) {
    searchParams.push(["date", params.to]);
  }
  if (params.court) {
    searchParams.push(["creator", params.court]);
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

  // Parse search results from Atom XML feed
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
    entries.push({
      ecli,
      title: titleMatch ? titleMatch[1].trim() : "",
      updated: updatedMatch ? updatedMatch[1].trim() : "",
      summary: summaryMatch ? summaryMatch[1].trim() : "",
      link: linkMatch ? linkMatch[1] : "",
      contentUrl: `https://data.rechtspraak.nl/uitspraken/content?id=${ecli}`,
    });
  }

  return { results: entries, total: entries.length };
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

  // Truncate to ~80k chars for AI processing
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
      max_tokens: 4096,
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
    // OpenRouter
    const requestedModel = model || "meta-llama/llama-3.3-70b-instruct:free";
    const isFreeModel = requestedModel.includes(":free");

    const freeFallbacks = [
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
      "deepseek/deepseek-r1:free",
      "qwen/qwen-2.5-72b-instruct:free",
      "meta-llama/llama-3.2-3b-instruct:free",
    ];

    // Build the list of models to try: the requested one first, then other free fallbacks
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

      // Parse error
      const errText = await response.text();
      let errMessage = `OpenRouter API error (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) errMessage += `: ${errJson.error.message}`;
      } catch {
        if (errText) errMessage += `: ${errText.substring(0, 200)}`;
      }
      lastError = errMessage;

      // Only retry for free models on 404/availability issues
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
      // Continue to next fallback model
    }

    throw new Error(
      `All free models were temporarily unavailable. Last error: ${lastError}. Try again later or use a paid model.`
    );
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

        const systemPrompt = `You are a flexible legal assistant specializing in Dutch law (Rechtspraak). You have access to the full text of court cases provided below. You can answer any question — case analysis, legal reasoning, comparisons between cases, general legal questions, drafting tasks, and more. Do not restrict yourself to only the current case; if the user references or compares other cases, use the provided context. If the user asks about a case that is not in the context, say so and answer from your general knowledge. Respond in the same language as the user's question, defaulting to English.\n\n${contextBlock}`;

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

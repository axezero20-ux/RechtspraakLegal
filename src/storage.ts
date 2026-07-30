import type { ApiConfig, AIProvider } from "./types";

const STORAGE_KEY = "rechtspraak_ai_config";

export const DEFAULT_API_KEY = "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";
export const DEFAULT_PROVIDER: AIProvider = "openrouter";
export const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

export function getDefaultApiConfig(): ApiConfig {
  return {
    provider: DEFAULT_PROVIDER,
    apiKey: DEFAULT_API_KEY,
    model: DEFAULT_MODEL,
  };
}

export function getApiConfig(): ApiConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ApiConfig;
  } catch {
    return null;
  }
}

export function saveApiConfig(config: ApiConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearApiConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function validateApiKey(provider: AIProvider, key: string): string | null {
  if (!key.trim()) return "API key is required";
  if (provider === "claude" && !key.startsWith("sk-ant")) {
    return "Claude API keys typically start with 'sk-ant'";
  }
  if (provider === "openrouter" && key.length < 20) {
    return "OpenRouter API key seems too short";
  }
  return null;
}

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  claude: "claude-sonnet-4-20250514",
  openrouter: DEFAULT_MODEL,
};

export const MODEL_OPTIONS: Record<AIProvider, { value: string; label: string }[]> = {
  claude: [
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
    { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
  ],
  openrouter: [
    { value: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "NVIDIA Nemotron 3 Ultra (Free, 1M ctx)" },
    { value: "nvidia/nemotron-3-super-120b-a12b:free", label: "NVIDIA Nemotron 3 Super (Free)" },
    { value: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", label: "NVIDIA Nemotron 3 Nano Omni (Free)" },
    { value: "nvidia/nemotron-3-nano-30b-a3b:free", label: "NVIDIA Nemotron 3 Nano 30B (Free)" },
    { value: "nvidia/nemotron-nano-12b-v2-vl:free", label: "NVIDIA Nemotron Nano 12B VL (Free)" },
    { value: "nvidia/nemotron-nano-9b-v2:free", label: "NVIDIA Nemotron Nano 9B V2 (Free)" },
    { value: "nvidia/nemotron-3.5-content-safety:free", label: "NVIDIA Nemotron 3.5 Content Safety (Free)" },
    { value: "google/gemma-4-31b-it:free", label: "Google Gemma 4 31B (Free)" },
    { value: "google/gemma-4-26b-a4b-it:free", label: "Google Gemma 4 26B A4B (Free)" },
    { value: "openai/gpt-oss-20b:free", label: "OpenAI gpt-oss-20b (Free)" },
    { value: "cohere/north-mini-code:free", label: "Cohere North Mini Code (Free)" },
    { value: "inclusionai/ling-3.0-flash:free", label: "Ling 3.0 Flash (Free)" },
    { value: "poolside/laguna-s-2.1:free", label: "Poolside Laguna S 2.1 (Free)" },
    { value: "poolside/laguna-xs-2.1:free", label: "Poolside Laguna XS 2.1 (Free)" },
  ],
};

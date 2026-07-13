import type { ApiConfig, AIProvider } from "./types";

const STORAGE_KEY = "rechtspraak_ai_config";

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
  openrouter: "meta-llama/llama-3.3-70b-instruct:free",
};

export const MODEL_OPTIONS: Record<AIProvider, { value: string; label: string }[]> = {
  claude: [
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
    { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
  ],
  openrouter: [
    { value: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (Free)" },
    { value: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash (Free)" },
    { value: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (Free)" },
    { value: "qwen/qwen-2.5-72b-instruct:free", label: "Qwen 2.5 72B (Free)" },
    { value: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B (Free)" },
  ],
};

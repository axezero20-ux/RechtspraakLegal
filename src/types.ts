export type AIProvider = "claude" | "openrouter";

export interface ApiConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface CaseMetadata {
  title?: string;
  creator?: string;
  date?: string;
  identifier?: string;
  subject?: string;
  zaaknummer?: string;
  summary?: string;
}

export interface CaseContent {
  ecli: string;
  metadata: CaseMetadata;
  text: string;
  fullLength: number;
}

export interface SearchResult {
  ecli: string;
  title: string;
  updated: string;
  summary: string;
  link: string;
  contentUrl: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

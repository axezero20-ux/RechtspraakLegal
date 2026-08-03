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

// ── Stage 2: Legal Analysis Types ───────────────────────────────────────────

export interface KeyArgument {
  party: string;
  argument: string;
  outcome: string;
}

export interface CitedLegislation {
  title: string;
  articles: string[];
  relevance: string;
}

export interface ReferencedCase {
  ecli: string;
  title: string;
  how: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
}

export interface CaseAnalysis {
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

export interface ComparisonDifference {
  topic: string;
  positions: { ecli: string; position: string }[];
}

export interface CaseComparison {
  commonPrinciples: string[];
  differences: ComparisonDifference[];
  convergencePoints: string[];
  divergencePoints: string[];
  legalEvolution: string;
  comparativeSummary: string;
  rawAnalysis?: string;
}

export interface SimilarPrecedent {
  ecli: string;
  title: string;
  similarity: "high" | "medium" | "low";
  reason: string;
  sharedPrinciples: string[];
  keyDifference: string;
}

export interface PrecedentAnalysis {
  similarPrecedents: SimilarPrecedent[];
  precedentSummary: string;
  rawAnalysis?: string;
}

// ── Matters / Workspace Types ───────────────────────────────────────────────

export type MatterStatus = "active" | "archived";

export interface Matter {
  id: string;
  user_id: string;
  title: string;
  client_ref: string | null;
  jurisdiction: string | null;
  status: MatterStatus;
  created_at: string;
  updated_at: string;
}

export type MatterItemType = "case" | "article" | "note" | "document" | "timeline";

export interface MatterItem {
  id: string;
  matter_id: string;
  type: MatterItemType;
  ecli: string | null;
  article_code: string | null;
  content: Record<string, unknown> | null;
  created_at: string;
}

export interface MatterChat {
  id: string;
  matter_id: string;
  messages: ChatMessage[] | null;
  updated_at: string;
}

export interface MatterSearch {
  id: string;
  matter_id: string;
  query: string | null;
  filters: Record<string, unknown> | null;
  results: SearchResult[];
  created_at: string;
}

export interface MatterComparison {
  id: string;
  matter_id: string;
  eclis: string[];
  result: CaseComparison;
  created_at: string;
}

export interface MatterUpload {
  id: string;
  matter_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  text_content: string | null;
  summary: string | null;
  chat: ChatMessage[] | null;
  created_at: string;
}

export type SubscriptionPlan = "free" | "pro";

export interface Subscription {
  user_id: string;
  plan: SubscriptionPlan;
  status: string;
  current_period_end: string | null;
}

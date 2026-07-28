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

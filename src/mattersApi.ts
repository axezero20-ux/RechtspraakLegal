import { supabase } from "./lib/supabase";
import type {
  Matter, MatterItem, MatterChat, ChatMessage, Subscription,
  MatterSearch, MatterComparison, MatterUpload, SearchResult, CaseComparison,
  CaseView, CaseAnalysis, PrecedentAnalysis, EcliPin,
} from "./types";

// ── Matters ──────────────────────────────────────────────────────────────────

export async function fetchMatters(): Promise<Matter[]> {
  const { data, error } = await supabase
    .from("matters")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Matter[];
}

export async function createMatter(title: string, clientRef?: string, jurisdiction?: string): Promise<Matter> {
  const { data, error } = await supabase
    .from("matters")
    .insert({ title, client_ref: clientRef || null, jurisdiction: jurisdiction || null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Matter;
}

export async function renameMatter(id: string, title: string): Promise<void> {
  const { error } = await supabase.from("matters").update({ title }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function archiveMatter(id: string): Promise<void> {
  const { error } = await supabase.from("matters").update({ status: "archived" }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function unarchiveMatter(id: string): Promise<void> {
  const { error } = await supabase.from("matters").update({ status: "active" }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMatter(id: string): Promise<void> {
  const { error } = await supabase.from("matters").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Matter Items ─────────────────────────────────────────────────────────────

export async function fetchMatterItems(matterId: string): Promise<MatterItem[]> {
  const { data, error } = await supabase
    .from("matter_items")
    .select("*")
    .eq("matter_id", matterId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as MatterItem[];
}

export async function addMatterItem(
  matterId: string,
  item: { type: MatterItem["type"]; ecli?: string | null; article_code?: string | null; content?: Record<string, unknown> | null },
): Promise<MatterItem> {
  const { data, error } = await supabase
    .from("matter_items")
    .insert({ matter_id: matterId, ...item })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MatterItem;
}

export async function deleteMatterItem(id: string): Promise<void> {
  const { error } = await supabase.from("matter_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Matter Chats ──────────────────────────────────────────────────────────────

export async function fetchMatterChat(matterId: string): Promise<MatterChat | null> {
  const { data, error } = await supabase
    .from("matter_chats")
    .select("*")
    .eq("matter_id", matterId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as MatterChat | null;
}

export async function saveMatterChat(matterId: string, messages: ChatMessage[]): Promise<void> {
  const existing = await fetchMatterChat(matterId);
  if (existing) {
    const { error } = await supabase
      .from("matter_chats")
      .update({ messages })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("matter_chats")
      .insert({ matter_id: matterId, messages });
    if (error) throw new Error(error.message);
  }
}

export async function clearMatterChat(matterId: string): Promise<void> {
  const { error } = await supabase.from("matter_chats").delete().eq("matter_id", matterId);
  if (error) throw new Error(error.message);
}

// ── Subscriptions ────────────────────────────────────────────────────────────

export async function fetchSubscription(): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Subscription | null;
}

export async function ensureSubscription(): Promise<Subscription> {
  const existing = await fetchSubscription();
  if (existing) return existing;
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ plan: "free", status: "active" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Subscription;
}

// ── Subscription enforcement via edge function ────────────────────────────────

export async function checkMatterLimit(): Promise<{ allowed: boolean; plan: string; activeCount: number; limit: number }> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/matter-limits`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Failed to check limit" }));
    throw new Error(err.error || `Failed (${response.status})`);
  }
  return response.json();
}

// ── Matter Searches ──────────────────────────────────────────────────────────

export async function fetchMatterSearches(matterId: string): Promise<MatterSearch[]> {
  const { data, error } = await supabase
    .from("matter_searches")
    .select("*")
    .eq("matter_id", matterId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as MatterSearch[];
}

export async function saveMatterSearch(
  matterId: string,
  query: string | null,
  filters: Record<string, unknown> | null,
  results: SearchResult[],
): Promise<MatterSearch> {
  const { data, error } = await supabase
    .from("matter_searches")
    .insert({ matter_id: matterId, query, filters, results })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MatterSearch;
}

export async function deleteMatterSearch(id: string): Promise<void> {
  const { error } = await supabase.from("matter_searches").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Matter Comparisons ───────────────────────────────────────────────────────

export async function fetchMatterComparisons(matterId: string): Promise<MatterComparison[]> {
  const { data, error } = await supabase
    .from("matter_comparisons")
    .select("*")
    .eq("matter_id", matterId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as MatterComparison[];
}

export async function saveMatterComparison(
  matterId: string,
  eclis: string[],
  result: CaseComparison,
): Promise<MatterComparison> {
  const { data, error } = await supabase
    .from("matter_comparisons")
    .insert({ matter_id: matterId, eclis, result })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MatterComparison;
}

export async function deleteMatterComparison(id: string): Promise<void> {
  const { error } = await supabase.from("matter_comparisons").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Matter Uploads ────────────────────────────────────────────────────────────

export async function fetchMatterUploads(matterId: string): Promise<MatterUpload[]> {
  const { data, error } = await supabase
    .from("matter_uploads")
    .select("*")
    .eq("matter_id", matterId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as MatterUpload[];
}

export async function saveMatterUpload(
  matterId: string,
  upload: {
    file_name: string;
    file_type: string | null;
    file_size: number | null;
    text_content: string | null;
    summary: string | null;
    chat: ChatMessage[] | null;
  },
): Promise<MatterUpload> {
  const { data, error } = await supabase
    .from("matter_uploads")
    .insert({ matter_id: matterId, ...upload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MatterUpload;
}

export async function updateMatterUpload(id: string, updates: Partial<Pick<MatterUpload, "summary" | "chat">>): Promise<void> {
  const { error } = await supabase.from("matter_uploads").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMatterUpload(id: string): Promise<void> {
  const { error } = await supabase.from("matter_uploads").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleMatterUploadPin(id: string, pinned: boolean): Promise<void> {
  const { error } = await supabase.from("matter_uploads").update({ pinned }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Case Views (saved case work: summary, analysis, precedents, chat) ──────────

export async function fetchCaseView(ecli: string): Promise<CaseView | null> {
  const { data, error } = await supabase
    .from("case_views")
    .select("*")
    .eq("ecli", ecli)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as CaseView | null;
}

export async function upsertCaseView(ecli: string, updates: {
  title?: string | null;
  summary?: string | null;
  analysis?: CaseAnalysis | null;
  precedents?: PrecedentAnalysis | null;
  chat?: ChatMessage[] | null;
}): Promise<CaseView> {
  const { data, error } = await supabase
    .from("case_views")
    .upsert({ ecli, ...updates }, { onConflict: "user_id,ecli" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CaseView;
}

export async function fetchAllCaseViews(): Promise<CaseView[]> {
  const { data, error } = await supabase
    .from("case_views")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as CaseView[];
}

export async function deleteCaseView(ecli: string): Promise<void> {
  const { error } = await supabase.from("case_views").delete().eq("ecli", ecli);
  if (error) throw new Error(error.message);
}

// ── ECLI Case Views (saved case work for ECLI-loaded cases) ───────────────────

export async function fetchEcliCaseView(ecli: string): Promise<CaseView | null> {
  const { data, error } = await supabase
    .from("ecli_case_views")
    .select("*")
    .eq("ecli", ecli)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as CaseView | null;
}

export async function upsertEcliCaseView(ecli: string, updates: {
  title?: string | null;
  summary?: string | null;
  analysis?: CaseAnalysis | null;
  precedents?: PrecedentAnalysis | null;
  chat?: ChatMessage[] | null;
}): Promise<CaseView> {
  const { data, error } = await supabase
    .from("ecli_case_views")
    .upsert({ ecli, ...updates }, { onConflict: "user_id,ecli" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as CaseView;
}

// ── ECLI Pins (ECLI Code panel pinned cases, separate from case_views) ───────

export async function fetchEcliPins(): Promise<EcliPin[]> {
  const { data, error } = await supabase
    .from("ecli_pins")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as EcliPin[];
}

export async function addEcliPin(ecli: string, title?: string | null): Promise<EcliPin> {
  const { data, error } = await supabase
    .from("ecli_pins")
    .insert({ ecli, title: title || null })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as EcliPin;
}

export async function deleteEcliPin(ecli: string): Promise<void> {
  const { error } = await supabase.from("ecli_pins").delete().eq("ecli", ecli);
  if (error) throw new Error(error.message);
}

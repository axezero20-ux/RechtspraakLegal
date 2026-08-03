import { supabase } from "./lib/supabase";
import type { Matter, MatterItem, MatterChat, ChatMessage, Subscription } from "./types";

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

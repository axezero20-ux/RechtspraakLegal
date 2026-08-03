import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FREE_MATTER_LIMIT = 1;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = userData.user.id;

    // Fetch subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    const plan = sub?.plan || "free";
    const subStatus = sub?.status || "active";
    const periodEnd = sub?.current_period_end;

    // Check if pro subscription is still active
    let effectivePlan = plan;
    if (plan === "pro") {
      if (subStatus !== "active") {
        effectivePlan = "free";
      } else if (periodEnd && new Date(periodEnd) < new Date()) {
        effectivePlan = "free";
      }
    }

    // Count active matters
    const { count, error: countError } = await supabase
      .from("matters")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active");

    if (countError) {
      return new Response(
        JSON.stringify({ error: "Failed to count matters" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const activeCount = count || 0;
    const limit = effectivePlan === "pro" ? Infinity : FREE_MATTER_LIMIT;
    const allowed = effectivePlan === "pro" || activeCount < limit;

    return new Response(
      JSON.stringify({
        allowed,
        plan: effectivePlan,
        activeCount,
        limit: effectivePlan === "pro" ? -1 : FREE_MATTER_LIMIT,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateSixDigitCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const num = arr[0] % 1000000;
  return String(num).padStart(6, "0");
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Antilles Legal <noreply@antilleslegal.com>",
      to: [to],
      subject,
      html,
    }),
  });

  return response.ok;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if a user with this email exists
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      return new Response(
        JSON.stringify({ error: "Unable to process request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userExists = userList.users.some(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!userExists) {
      // For security, don't reveal whether the email exists.
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a 6-digit code
    const code = generateSixDigitCode();
    const codeHash = await sha256(normalizedEmail + ":" + code);

    // Invalidate any previous unused codes for this email
    await supabase
      .from("password_reset_codes")
      .update({ used: true })
      .eq("email", normalizedEmail)
      .eq("used", false);

    // Store the new code (expires in 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from("password_reset_codes")
      .insert({
        email: normalizedEmail,
        code_hash: codeHash,
        expires_at: expiresAt,
        used: false,
      });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Unable to generate reset code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send the email with the 6-digit code
    const emailSubject = "Your Antilles Legal Password Reset Code";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Reset Your Password</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          You requested a password reset for your Antilles Legal account.
          Use the verification code below to reset your password:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; font-size: 36px; font-weight: bold;
                      letter-spacing: 8px; color: #2563eb; background: #f1f5f9;
                      padding: 16px 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
            ${code}
          </div>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          This code will expire in 15 minutes. If you did not request a password
          reset, you can safely ignore this email.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          Antilles Legal — Do not reply to this email.
        </p>
      </div>
    `;

    const emailSent = await sendEmailViaResend(normalizedEmail, emailSubject, emailHtml);

    if (!emailSent) {
      // No Resend API key configured — return the code in the response
      // so the frontend can display it as a fallback
      return new Response(
        JSON.stringify({ success: true, code, fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

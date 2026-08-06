import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hormtmwyckjiaxalonum.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvcm10bXd5Y2tqaWF4YWxvbnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjU4NjMsImV4cCI6MjEwMTE0MTg2M30.KiSDEU-sTobgNV7D0QUwEOwItJxALpNMlRs7UBezpl4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

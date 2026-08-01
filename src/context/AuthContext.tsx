import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  emailConfirmed: boolean;
  clearEmailConfirmed: () => void;
  signUp: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch profile:", error.message);
      return;
    }

    // Fallback: if no profile row exists, try to create one from auth user metadata
    if (!data) {
      const { data: userData } = await supabase.auth.getUser();
      const meta = userData.user?.user_metadata;
      if (meta) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: userId,
          email: userData.user?.email || "",
          first_name: meta.first_name || "",
          last_name: meta.last_name || "",
          phone: meta.phone || null,
        });
        if (insertError) {
          console.error("Failed to create profile fallback:", insertError.message);
          return;
        }
        // Re-fetch after insert
        const { data: refetched } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, phone")
          .eq("id", userId)
          .maybeSingle();
        setProfile(refetched as Profile | null);
        return;
      }
    }

    setProfile(data as Profile | null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Detect email confirmation: a session appears via a redirect (not an explicit sign-in)
      // and the user was not previously logged in.
      if (event === "SIGNED_IN" && newSession?.user?.email_confirmed_at && !session) {
        // This is the email-confirmation redirect — sign them out and show the confirmed landing page
        supabase.auth.signOut().then(() => {
          setSession(null);
          setProfile(null);
          setEmailConfirmed(true);
          setLoading(false);
        });
        return;
      }

      setSession(newSession);
      if (newSession?.user) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<{ error: string | null; needsEmailConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          first_name: params.firstName,
          last_name: params.lastName,
          phone: params.phone,
        },
      },
    });

    if (error) {
      return { error: error.message, needsEmailConfirmation: false };
    }

    // If no session was created, email confirmation is required
    const needsConfirmation = !data.session;
    return { error: null, needsEmailConfirmation: needsConfirmation };
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null; needsEmailConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message, needsEmailConfirmation: false };
    }
    // Check if email is confirmed from the actual response, not stale state
    const needsConfirmation = !data.user?.email_confirmed_at;
    return { error: null, needsEmailConfirmation: needsConfirmation };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  function clearEmailConfirmed() {
    setEmailConfirmed(false);
  }

  async function refreshProfile() {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    emailConfirmed,
    clearEmailConfirmed,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

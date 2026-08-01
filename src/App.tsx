import { useState } from "react";
import ApiSetup from "./components/ApiSetup";
import Dashboard from "./components/Dashboard";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import EmailVerification from "./components/EmailVerification";
import { AuthProvider, useAuth } from "./context/AuthContext";
import type { ApiConfig } from "./types";
import { getApiConfig, getDefaultApiConfig, saveApiConfig } from "./storage";
import { Loader2 } from "lucide-react";

function loadConfig(): ApiConfig {
  const stored = getApiConfig();
  if (stored) return stored;
  const defaults = getDefaultApiConfig();
  saveApiConfig(defaults);
  return defaults;
}

type AuthScreen = "signin" | "signup" | "verification";

function AppContent() {
  const { session, user, loading } = useAuth();
  const [config, setConfig] = useState<ApiConfig>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("signin");
  const [pendingEmail, setPendingEmail] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Not signed in — show auth screens
  if (!session || !user) {
    if (authScreen === "signup") {
      return (
        <SignUp
          onSwitchToSignIn={() => setAuthScreen("signin")}
        />
      );
    }

    if (authScreen === "verification") {
      return (
        <EmailVerification
          email={pendingEmail}
          onSwitchToSignIn={() => setAuthScreen("signin")}
        />
      );
    }

    return (
      <SignIn
        onSwitchToSignUp={() => setAuthScreen("signup")}
        onEmailVerificationNeeded={(email) => {
          setPendingEmail(email);
          setAuthScreen("verification");
        }}
      />
    );
  }

  // Email not confirmed — show verification screen
  if (!user.email_confirmed_at) {
    return (
      <EmailVerification
        email={user.email || pendingEmail}
        onSwitchToSignIn={() => setAuthScreen("signin")}
      />
    );
  }

  // Signed in and verified — show the app
  if (showSettings) {
    return (
      <ApiSetup
        onComplete={(c) => {
          setConfig(c);
          setShowSettings(false);
        }}
        isSettings
        existingConfig={config}
        onCancel={() => setShowSettings(false)}
      />
    );
  }

  return (
    <Dashboard
      config={config}
      onSettings={() => setShowSettings(true)}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

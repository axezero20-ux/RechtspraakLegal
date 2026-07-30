import { useState, useEffect } from "react";
import ApiSetup from "./components/ApiSetup";
import Dashboard from "./components/Dashboard";
import type { ApiConfig } from "./types";
import { getApiConfig, getDefaultApiConfig } from "./storage";

export default function App() {
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = getApiConfig();
    setConfig(stored ?? getDefaultApiConfig());
    setInitialized(true);
  }, []);

  if (!initialized) return null;

  if (showSettings) {
    return (
      <ApiSetup
        onComplete={(c) => {
          setConfig(c);
          setShowSettings(false);
        }}
        isSettings={showSettings}
        existingConfig={config}
        onCancel={() => setShowSettings(false)}
      />
    );
  }

  return (
    <Dashboard
      config={config!}
      onSettings={() => setShowSettings(true)}
    />
  );
}

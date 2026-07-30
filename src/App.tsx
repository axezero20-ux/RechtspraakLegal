import { useState } from "react";
import ApiSetup from "./components/ApiSetup";
import Dashboard from "./components/Dashboard";
import type { ApiConfig } from "./types";
import { getApiConfig, getDefaultApiConfig, saveApiConfig } from "./storage";

function loadConfig(): ApiConfig {
  const stored = getApiConfig();
  if (stored) return stored;
  const defaults = getDefaultApiConfig();
  saveApiConfig(defaults);
  return defaults;
}

export default function App() {
  const [config, setConfig] = useState<ApiConfig>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);

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

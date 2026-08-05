import { useState } from "react";
import { Scale, Key, ArrowRight, Settings, Shield, FileText, Brain } from "lucide-react";
import type { ApiConfig, AIProvider } from "../types";
import {
  saveApiConfig,
  validateApiKey,
  DEFAULT_MODELS,
  MODEL_OPTIONS,
  DEFAULT_PROVIDER,
  DEFAULT_API_KEY,
  DEFAULT_MODEL,
} from "../storage";

interface Props {
  onComplete: (config: ApiConfig) => void;
  isSettings?: boolean;
  existingConfig?: ApiConfig | null;
  onCancel?: () => void;
}

export default function ApiSetup({ onComplete, isSettings, existingConfig, onCancel }: Props) {
  const [provider, setProvider] = useState<AIProvider>(existingConfig?.provider || DEFAULT_PROVIDER);
  const [apiKey, setApiKey] = useState(existingConfig?.apiKey || DEFAULT_API_KEY);
  const [model, setModel] = useState(existingConfig?.model || DEFAULT_MODELS[existingConfig?.provider || DEFAULT_PROVIDER]);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateApiKey(provider, apiKey);
    if (validationError) {
      setError(validationError);
      return;
    }
    const config: ApiConfig = { provider, apiKey: apiKey.trim(), model };
    saveApiConfig(config);
    onComplete(config);
  }

  function handleProviderChange(p: AIProvider) {
    setProvider(p);
    if (p === DEFAULT_PROVIDER) {
      setApiKey(DEFAULT_API_KEY);
      setModel(DEFAULT_MODEL);
    } else {
      setApiKey("");
      setModel(DEFAULT_MODELS[p]);
    }
    setError(null);
  }

  function resetToDefaults() {
    setProvider(DEFAULT_PROVIDER);
    setApiKey(DEFAULT_API_KEY);
    setModel(DEFAULT_MODEL);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Antilles Legal" className="w-16 h-16 rounded-2xl object-contain shadow-lg shadow-blue-500/20 mb-4" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Antilles Legal</h1>
          <p className="text-slate-400 mt-2">
            {isSettings ? "Update your API configuration" : "Legal Intelligence for the Dutch Caribbean"}
          </p>
        </div>

        <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          {!isSettings && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: FileText, label: "Search Cases" },
                { icon: Brain, label: "AI Analysis" },
                { icon: Shield, label: "Local Storage" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs text-slate-400">{f.label}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Provider selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Select AI Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleProviderChange("claude")}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    provider === "claude"
                      ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AI</span>
                  </div>
                  <span className="text-sm font-medium">Claude API</span>
                  <span className="text-xs text-slate-500">Anthropic</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderChange("openrouter")}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    provider === "openrouter"
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">OR</span>
                  </div>
                  <span className="text-sm font-medium">OpenRouter</span>
                  <span className="text-xs text-slate-500">Multi-model</span>
                </button>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setError(null); }}
                  placeholder={provider === "claude" ? "sk-ant-..." : "sk-or-..."}
                  className="w-full pl-10 pr-20 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Stored locally in your browser. Never sent to our servers.
              </p>
            </div>

            {/* Model selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                list={`model-suggestions-${provider}`}
                placeholder={provider === "claude" ? "claude-sonnet-4-20250514" : "nvidia/nemotron-3-ultra-550b-a55b:free"}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              />
              <datalist id={`model-suggestions-${provider}`}>
                {MODEL_OPTIONS[provider].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </datalist>
              <p className="mt-2 text-xs text-slate-500">
                Enter any model ID, or pick from suggestions. {provider === "openrouter" && "All listed models are free on OpenRouter."}
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {isSettings && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700/50 transition-all font-medium"
                >
                  Cancel
                </button>
              )}
              {isSettings && (
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700/50 transition-all font-medium"
                >
                  Reset to Defaults
                </button>
              )}
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-emerald-600 transition-all shadow-lg shadow-blue-500/20"
              >
                {isSettings ? (
                  <>
                    <Settings className="w-5 h-5" />
                    Save Settings
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {!isSettings && (
            <p className="mt-6 text-center text-xs text-slate-500">
              Get your API key from{" "}
              <a
                href={provider === "claude" ? "https://console.anthropic.com/settings/keys" : "https://openrouter.ai/keys"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {provider === "claude" ? "console.anthropic.com" : "openrouter.ai"}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

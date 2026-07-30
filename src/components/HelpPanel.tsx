import { useState } from "react";
import {
  BookOpen, Key, CreditCard, Cpu, Settings2, CheckSquare, AlertTriangle,
  ChevronDown, ChevronRight, Shield, ExternalLink,
} from "lucide-react";

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-sm text-blue-800 mt-3">
      <span className="shrink-0 mt-0.5 text-blue-500">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7" stroke="currentColor"/><path d="M7.5 5v1M7.5 7.5v3" stroke="currentColor" strokeLinecap="round"/></svg>
      </span>
      <span>{children}</span>
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-sm text-amber-800 mt-3">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
      <span>{children}</span>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {number}
        </div>
        <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
      </div>
      <div className="ml-10 text-sm text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: "overview",
    icon: BookOpen,
    title: "Overview",
    content: (
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        <p>
          This guide walks you through creating a Claude API key on the Anthropic Claude Console,
          funding your account, choosing a model ID, and entering both in Rechtspraak AI settings.
        </p>
        <div>
          <p className="font-semibold text-slate-700 mb-2">What you need</p>
          <ul className="space-y-1.5 ml-1">
            {[
              "A web browser and access to platform.claude.com",
              "An Anthropic Claude Console account",
              "A payment method to purchase API credits",
              "Access to the Rechtspraak AI application",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-700 mb-2">Steps at a glance</p>
          <ol className="space-y-1.5 ml-1">
            {[
              "Steps 1–5 — Sign in and create a Claude API key",
              "Steps 6–7 — Add billing credits",
              "Steps 8–9 — Choose a model and copy its model ID",
              "Steps 10–11 — Configure Claude in Rechtspraak AI Settings",
            ].map((item, i) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold text-xs mt-0.5 w-4 shrink-0">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </div>
        <WarningBox>
          <strong>Security:</strong> Treat your API key like a password. Anyone with the key can use your paid Claude credits. If a key is exposed, revoke it in the Claude Console and create a new one.
        </WarningBox>
      </div>
    ),
  },
  {
    id: "create-key",
    icon: Key,
    title: "Create an API Key",
    content: (
      <div>
        <Step number={1} title="Open the Claude Console and sign in">
          <p>
            Go to{" "}
            <a href="https://platform.claude.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
              platform.claude.com <ExternalLink className="w-3 h-3" />
            </a>{" "}
            in your browser. Continue with Google or enter your email and select{" "}
            <strong>Continue with email</strong>. Complete any verification prompts until you reach the
            Console dashboard.
          </p>
          <TipBox>Use the Anthropic account you want linked to API billing. Accept Anthropic's Commercial Terms and Usage Policy if prompted.</TipBox>
        </Step>

        <Step number={2} title="Open API keys from the sidebar">
          <p>
            After you land on the dashboard, look at the left sidebar. Select <strong>API keys</strong> (key
            icon) under the main navigation. You can also use <strong>Get API key</strong> in the top-right
            if available.
          </p>
          <TipBox>Confirm you are in the correct workspace (for example, Default) at the top of the sidebar.</TipBox>
        </Step>

        <Step number={3} title="Start creating a new API key">
          <p>
            On the API keys page, select <strong>+ Create key</strong> in the top-right corner. If you have
            no keys yet, the empty state also explains that you need a key to integrate with the Claude API.
          </p>
        </Step>

        <Step number={4} title="Name the key and set expiry">
          <p>In the <strong>Create API key</strong> dialog:</p>
          <ol className="mt-2 space-y-1 ml-4 list-decimal">
            <li>Confirm the correct Workspace (for example, Default).</li>
            <li>Enter a clear Name such as <code className="bg-slate-100 px-1 rounded text-xs">my-api-key</code> or <code className="bg-slate-100 px-1 rounded text-xs">rechtspraak-ai</code>.</li>
            <li>Set Expires as needed (Never is common for personal tools; shorter expiry is safer for shared environments).</li>
            <li>Select <strong>Add</strong> to create the key.</li>
          </ol>
          <TipBox>Never share long-lived keys in public repos, client-side code, or chat messages.</TipBox>
        </Step>

        <Step number={5} title="Copy and store your API key securely">
          <p>
            A <strong>Save your API key</strong> dialog appears with the full key value. Select{" "}
            <strong>Copy key</strong> and store it in a password manager or another secure place. Then select{" "}
            <strong>Done</strong>.
          </p>
          <div className="mt-3 space-y-1.5">
            {[
              "Anthropic shows the full key only once. If you lose it, create a new key and revoke the old one.",
              "Your key typically starts with sk-ant-…",
              "Do not paste your key into emails, tickets, or public documents.",
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2 text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                {tip}
              </div>
            ))}
          </div>
        </Step>
      </div>
    ),
  },
  {
    id: "billing",
    icon: CreditCard,
    title: "Add Billing Credits",
    content: (
      <div>
        <Step number={6} title="Add credits so the API can run">
          <p>
            API usage requires organization credits. In the left sidebar, find <strong>Credits</strong> and
            select <strong>Add funds</strong>.
          </p>
          <WarningBox>A $0.00 balance means requests will fail until you purchase credits.</WarningBox>
        </Step>

        <Step number={7} title="Complete billing and buy credits">
          <p>In the <strong>Start building with Claude</strong> checkout dialog:</p>
          <ol className="mt-2 space-y-1 ml-4 list-decimal">
            <li>Choose a credit amount ($5, $20 recommended, $100, or Other).</li>
            <li>Enter your billing address and credit card details.</li>
            <li>Review usage credits, estimated tax, and total due.</li>
            <li>Select <strong>Buy … of credits</strong> to complete the purchase.</li>
          </ol>
          <TipBox>Credits are consumed by API (and related) usage and may expire per Anthropic's credit terms.</TipBox>
        </Step>
      </div>
    ),
  },
  {
    id: "model",
    icon: Cpu,
    title: "Choose a Model",
    content: (
      <div>
        <Step number={8} title="Find available Claude models on the Dashboard">
          <p>
            Return to <strong>Dashboard</strong> in the left sidebar. Scroll to the <strong>Models</strong>{" "}
            section. Here you can review current Claude models (for example Fable 5, Opus 5, Sonnet 5,
            Haiku 4.5) and open a model card for details.
          </p>
          <div className="mt-3 space-y-1.5">
            {[
              "Pick a model that balances quality, speed, and cost for legal research in Rechtspraak AI.",
              "Haiku is usually fastest and lowest cost; Sonnet/Opus-class models are stronger for complex reasoning.",
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2 text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                {tip}
              </div>
            ))}
          </div>
        </Step>

        <Step number={9} title="Copy the exact model ID">
          <p>
            Open the model you want to use. On the model details card, copy the model ID (the pill under
            the model name, for example{" "}
            <code className="bg-slate-100 px-1 rounded text-xs">claude-haiku-4-5-20251001</code>). Use the
            copy control next to the ID so you paste the exact string into Rechtspraak AI.
          </p>
          <div className="mt-3 space-y-1.5">
            {[
              "Model IDs change over time. Always copy the ID shown in your Console rather than guessing.",
              "You will paste this value into the Model field in Rechtspraak AI settings.",
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2 text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                {tip}
              </div>
            ))}
          </div>
        </Step>
      </div>
    ),
  },
  {
    id: "configure",
    icon: Settings2,
    title: "Configure in Rechtspraak AI",
    content: (
      <div>
        <Step number={10} title="Open Settings in Rechtspraak AI">
          <p>
            In the Rechtspraak AI app, click the <strong>Settings</strong> button in the top-right corner
            of the header (gear icon).
          </p>
        </Step>

        <Step number={11} title="Enter your Claude API key and model, then save">
          <p>On the settings screen:</p>
          <ol className="mt-2 space-y-1 ml-4 list-decimal">
            <li>Under <strong>Select AI Provider</strong>, choose <strong>Claude API (Anthropic)</strong>.</li>
            <li>In <strong>API Key</strong>, paste the key you copied from the Claude Console (<code className="bg-slate-100 px-1 rounded text-xs">sk-ant-…</code>).</li>
            <li>In <strong>Model</strong>, paste the model ID you copied (for example <code className="bg-slate-100 px-1 rounded text-xs">claude-sonnet-4-20250514</code> or the Haiku ID from Step 9).</li>
            <li>Select <strong>Save Settings</strong>.</li>
          </ol>
          <div className="mt-3 space-y-1.5">
            {[
              "Rechtspraak AI stores the key locally in your browser and does not send it to app servers.",
              "You can enter any valid model ID or pick from suggestions when available.",
              "Use Reset to Defaults only if you want to clear your custom configuration.",
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2 text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                {tip}
              </div>
            ))}
          </div>
        </Step>
      </div>
    ),
  },
  {
    id: "checklist",
    icon: CheckSquare,
    title: "Quick Checklist",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Use this checklist to confirm everything is set up correctly before using the AI features.</p>
        <div className="space-y-2">
          {[
            { text: "Signed in at platform.claude.com", sub: "" },
            { text: "Created and securely stored an API key", sub: "starts with sk-ant-…" },
            { text: "Added credits so the balance is greater than $0.00", sub: "" },
            { text: "Copied the exact model ID from the Dashboard model card", sub: "" },
            { text: "In Rechtspraak AI → Settings, selected Claude API", sub: "" },
            { text: "Pasted API key and model ID, then saved settings", sub: "" },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-5 h-5 rounded border-2 border-slate-300 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-700">{item.text}</p>
                {item.sub && <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "troubleshooting",
    icon: AlertTriangle,
    title: "Troubleshooting",
    content: (
      <div className="space-y-3">
        {[
          {
            problem: "API errors after setup",
            fix: "Confirm credits are funded and the key was copied in full with no extra spaces.",
          },
          {
            problem: "Invalid model error",
            fix: "Re-copy the model ID from the Console model card. IDs are case-sensitive and versioned.",
          },
          {
            problem: "Lost API key",
            fix: "Create a new key in Claude Console → API keys. You cannot recover a previous secret.",
          },
          {
            problem: "Wrong provider in the app",
            fix: "In Settings, ensure Claude API is selected, not OpenRouter.",
          },
        ].map((item) => (
          <div key={item.problem} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700 mb-1">{item.problem}</p>
            <p className="text-sm text-slate-600">{item.fix}</p>
          </div>
        ))}
        <TipBox>
          Model names and Console UI labels can change as Anthropic updates the platform. If a screen looks
          slightly different, follow the same path: API keys → create key → add funds → Dashboard models →
          Rechtspraak AI Settings.
        </TipBox>
      </div>
    ),
  },
];

export default function HelpPanel() {
  const [openSection, setOpenSection] = useState<string>("overview");

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-5 shrink-0">
        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-800">Help & Setup Guide</h2>
        </div>
        <p className="text-sm text-slate-500 ml-7.5">
          Claude API Setup — how to get an API key, add credits, and configure the app.
        </p>
      </div>

      {/* Accordion sections */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {SECTIONS.map((section) => {
          const isOpen = openSection === section.id;
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className={`rounded-xl border transition-all ${
                isOpen ? "border-blue-200 bg-white shadow-sm" : "border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300"
              }`}
            >
              <button
                onClick={() => setOpenSection(isOpen ? "" : section.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isOpen ? "bg-blue-600" : "bg-slate-200"}`}>
                    <Icon className={`w-3.5 h-3.5 ${isOpen ? "text-white" : "text-slate-500"}`} />
                  </div>
                  <span className={`text-sm font-semibold ${isOpen ? "text-blue-700" : "text-slate-700"}`}>
                    {section.title}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-blue-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0">
                  <div className="border-t border-blue-100 pt-4">{section.content}</div>
                </div>
              )}
            </div>
          );
        })}

        {/* Footer note */}
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 mt-2">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 leading-relaxed">
            <strong>Privacy:</strong> Your API key is stored only in your browser's local storage. It is never transmitted to Rechtspraak AI servers.
          </p>
        </div>
      </div>
    </div>
  );
}

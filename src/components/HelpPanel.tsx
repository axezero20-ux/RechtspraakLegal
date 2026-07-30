import { useState } from "react";
import {
  BookOpen, Key, CreditCard, Cpu, Settings2, CheckSquare, AlertTriangle,
  ChevronDown, ChevronRight, Shield, ExternalLink, Info,
} from "lucide-react";

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-sm text-blue-800 mt-3 leading-relaxed">
      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
      <span>{children}</span>
    </div>
  );
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-sm text-amber-800 mt-3 leading-relaxed">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
      <span>{children}</span>
    </div>
  );
}

function StepBlock({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {number}
        </div>
        <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
      </div>
      <div className="ml-10 text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 mt-1">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-1.5 mt-1 ml-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-blue-600 font-semibold text-xs mt-0.5 w-4 shrink-0">{i + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

const SECTIONS = [
  {
    id: "overview",
    icon: BookOpen,
    title: "Overview",
    content: (
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        <p>
          This guide walks you through creating a Claude API key on the Anthropic Claude Console (
          <a
            href="https://platform.claude.com/"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
          >
            platform.claude.com <ExternalLink className="w-3 h-3" />
          </a>
          ), funding your account, choosing a model ID, and entering both the API key and model in
          Rechtspraak AI settings.
        </p>

        <div>
          <p className="font-semibold text-slate-700 mb-1.5">What you need</p>
          <BulletList
            items={[
              "A web browser and access to https://platform.claude.com/",
              "An Anthropic Claude Console account",
              "A payment method to purchase API credits",
              "Access to the Rechtspraak AI application",
            ]}
          />
        </div>

        <div>
          <p className="font-semibold text-slate-700 mb-1.5">Steps at a glance</p>
          <NumberedList
            items={[
              "Steps 1–5 — Sign in and create a Claude API key",
              "Steps 6–7 — Add billing credits",
              "Steps 8–9 — Choose a model and copy its model ID",
              "Steps 10–11 — Configure Claude in Rechtspraak AI Settings",
            ]}
          />
        </div>

        <WarningBox>
          <strong>Security:</strong> Treat your API key like a password. Anyone with the key can use
          your paid Claude credits. If a key is exposed, revoke it in the Claude Console and create
          a new one.
        </WarningBox>
      </div>
    ),
  },
  {
    id: "steps1to5",
    icon: Key,
    title: "Steps 1–5: Create an API Key",
    content: (
      <div>
        <StepBlock number={1} title="Open the Claude Console and sign in">
          <p>
            Go to{" "}
            <a
              href="https://platform.claude.com/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
            >
              https://platform.claude.com/ <ExternalLink className="w-3 h-3" />
            </a>{" "}
            in your browser. On the Claude Console sign-in page, continue with Google or enter your
            email and select <strong>Continue with email</strong>. Complete any verification prompts
            until you reach the Console dashboard.
          </p>
          <TipBox>
            <BulletList
              items={[
                "Use the Anthropic account you want linked to API billing.",
                "Accept Anthropic's Commercial Terms and Usage Policy if prompted.",
              ]}
            />
          </TipBox>
        </StepBlock>

        <StepBlock number={2} title="Open API keys from the sidebar">
          <p>
            After you land on the dashboard, look at the left sidebar. Select <strong>API keys</strong>{" "}
            (key icon) under the main navigation. You can also use <strong>Get API key</strong> in the
            top-right if available.
          </p>
          <TipBox>
            Confirm you are in the correct workspace (for example, <strong>Default</strong>) at the
            top of the sidebar.
          </TipBox>
        </StepBlock>

        <StepBlock number={3} title="Start creating a new API key">
          <p>
            On the API keys page, select <strong>+ Create key</strong> in the top-right corner. If you
            have no keys yet, the empty state also explains that you need a key to integrate with the
            Claude API.
          </p>
        </StepBlock>

        <StepBlock number={4} title="Name the key and set expiry">
          <p>In the <strong>Create API key</strong> dialog:</p>
          <NumberedList
            items={[
              "Confirm the correct Workspace (for example, Default).",
              <>Enter a clear Name such as <code className="bg-slate-100 px-1 rounded text-xs">my-api-key</code> or <code className="bg-slate-100 px-1 rounded text-xs">rechtspraak-ai</code>.</>,
              "Set Expires as needed (Never is common for personal tools; shorter expiry is safer for shared environments).",
              <>Select <strong>Add</strong> to create the key.</>,
            ]}
          />
          <TipBox>Never share long-lived keys in public repos, client-side code, or chat messages.</TipBox>
        </StepBlock>

        <StepBlock number={5} title="Copy and store your API key securely">
          <p>
            A <strong>Save your API key</strong> dialog appears with the full key value. Select{" "}
            <strong>Copy key</strong> and store it in a password manager or another secure place. Then
            select <strong>Done</strong>.
          </p>
          <TipBox>
            <BulletList
              items={[
                "Anthropic shows the full key only once. If you lose it, create a new key and revoke the old one.",
                "Your key typically starts with sk-ant-…",
                "Do not paste your key into emails, tickets, or public documents.",
              ]}
            />
          </TipBox>
        </StepBlock>
      </div>
    ),
  },
  {
    id: "steps6to7",
    icon: CreditCard,
    title: "Steps 6–7: Add Billing Credits",
    content: (
      <div>
        <StepBlock number={6} title="Add credits so the API can run">
          <p>
            API usage requires organization credits. In the left sidebar, find{" "}
            <strong>Credits</strong> and select <strong>Add funds</strong>.
          </p>
          <WarningBox>
            A $0.00 balance means requests will fail until you purchase credits.
          </WarningBox>
        </StepBlock>

        <StepBlock number={7} title="Complete billing and buy credits">
          <p>In the <strong>Start building with Claude</strong> checkout dialog:</p>
          <NumberedList
            items={[
              "Choose a credit amount ($5, $20 recommended, $100, or Other).",
              "Enter your billing address and credit card details.",
              "Review usage credits, estimated tax, and total due.",
              <>Select <strong>Buy … of credits</strong> to complete the purchase.</>,
            ]}
          />
          <TipBox>
            Credits are consumed by API (and related) usage and may expire per Anthropic's credit
            terms.
          </TipBox>
        </StepBlock>
      </div>
    ),
  },
  {
    id: "steps8to9",
    icon: Cpu,
    title: "Steps 8–9: Choose a Model",
    content: (
      <div>
        <StepBlock number={8} title="Find available Claude models on the Dashboard">
          <p>
            Return to <strong>Dashboard</strong> in the left sidebar. Scroll to the{" "}
            <strong>Models</strong> section. Here you can review current Claude models (for example
            Fable 5, Opus 5, Sonnet 5, Haiku 4.5) and open a model card for details.
          </p>
          <TipBox>
            <BulletList
              items={[
                "Pick a model that balances quality, speed, and cost for legal research in Rechtspraak AI.",
                "Haiku is usually fastest and lowest cost; Sonnet/Opus-class models are stronger for complex reasoning.",
              ]}
            />
          </TipBox>
        </StepBlock>

        <StepBlock number={9} title="Copy the exact model ID">
          <p>
            Open the model you want to use. On the model details card, copy the model ID (the pill
            under the model name, for example{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">
              claude-haiku-4-5-20251001
            </code>
            ). Use the copy control next to the ID so you paste the exact string into Rechtspraak AI.
          </p>
          <TipBox>
            <BulletList
              items={[
                "Model IDs change over time. Always copy the ID shown in your Console rather than guessing.",
                "You will paste this value into the Model field in Rechtspraak AI settings.",
              ]}
            />
          </TipBox>
        </StepBlock>
      </div>
    ),
  },
  {
    id: "steps10to11",
    icon: Settings2,
    title: "Steps 10–11: Configure in Rechtspraak AI",
    content: (
      <div>
        <StepBlock number={10} title="Open Settings in Rechtspraak AI">
          <p>
            Open the <strong>Rechtspraak AI</strong> app (Dutch Legal Research Assistant). In the
            top-right corner, select the gear icon labeled <strong>Settings</strong>.
          </p>
        </StepBlock>

        <StepBlock number={11} title="Enter your Claude API key and model, then save">
          <p>On the settings screen:</p>
          <NumberedList
            items={[
              <>Under <strong>Select AI Provider</strong>, choose <strong>Claude API (Anthropic)</strong>.</>,
              <>In <strong>API Key</strong>, paste the key you copied from the Claude Console (<code className="bg-slate-100 px-1 rounded text-xs">sk-ant-…</code>).</>,
              <>In <strong>Model</strong>, paste the model ID you copied (for example <code className="bg-slate-100 px-1 rounded text-xs">claude-sonnet-4-20250514</code> or the Haiku ID from Step 9).</>,
              <>Select <strong>Save Settings</strong>.</>,
            ]}
          />
          <TipBox>
            <BulletList
              items={[
                "Rechtspraak AI stores the key locally in your browser and does not send it to app servers.",
                "You can enter any valid model ID or pick from suggestions when available.",
                "Use Reset to Defaults only if you want to clear your custom configuration.",
              ]}
            />
          </TipBox>
        </StepBlock>
      </div>
    ),
  },
  {
    id: "checklist",
    icon: CheckSquare,
    title: "Quick Checklist",
    content: (
      <div className="space-y-2">
        <p className="text-sm text-slate-600 mb-3">
          Use this checklist to confirm everything is set up before using the AI features.
        </p>
        {[
          { label: "Signed in at https://platform.claude.com/", sub: "" },
          { label: "Created and securely stored an API key", sub: "starts with sk-ant-…" },
          { label: "Added credits so the balance is greater than $0.00", sub: "" },
          { label: "Copied the exact model ID from the Dashboard model card", sub: "" },
          { label: "In Rechtspraak AI → Settings, selected Claude API", sub: "" },
          { label: "Pasted API key and model ID, then saved settings", sub: "" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="w-4 h-4 rounded border-2 border-slate-300 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700">{item.label}</p>
              {item.sub && (
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{item.sub}</p>
              )}
            </div>
          </div>
        ))}
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
            problem: "Invalid model",
            fix: "Re-copy the model ID from the Console model card. IDs are case-sensitive and versioned.",
          },
          {
            problem: "Lost API key",
            fix: "Create a new key in Claude Console → API keys. You cannot recover the previous secret.",
          },
          {
            problem: "Wrong provider in the app",
            fix: "In Settings, ensure Claude API is selected, not OpenRouter.",
          },
        ].map((item) => (
          <div
            key={item.problem}
            className="p-3.5 rounded-lg border border-slate-200 bg-slate-50"
          >
            <p className="text-sm font-semibold text-slate-700 mb-1">{item.problem}</p>
            <p className="text-sm text-slate-600 leading-relaxed">{item.fix}</p>
          </div>
        ))}

        <TipBox>
          <strong>Note:</strong> Model names and Console UI labels can change as Anthropic updates
          the platform. If a screen looks slightly different, follow the same path: API keys → create
          key → add funds → Dashboard models → Rechtspraak AI Settings.
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
          <h2 className="text-lg font-bold text-slate-800">Help &amp; Setup Guide</h2>
        </div>
        <p className="text-sm text-slate-500 ml-7.5">
          Claude API Setup — create an API key, add credits, and configure the app.
        </p>
      </div>

      {/* Accordion */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {SECTIONS.map((section) => {
          const isOpen = openSection === section.id;
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className={`rounded-xl border transition-all ${
                isOpen
                  ? "border-blue-200 bg-white shadow-sm"
                  : "border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300"
              }`}
            >
              <button
                onClick={() => setOpenSection(isOpen ? "" : section.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isOpen ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${isOpen ? "text-white" : "text-slate-500"}`}
                    />
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      isOpen ? "text-blue-700" : "text-slate-700"
                    }`}
                  >
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
                <div className="px-4 pb-5 pt-0">
                  <div className="border-t border-blue-100 pt-4">{section.content}</div>
                </div>
              )}
            </div>
          );
        })}

        {/* Privacy footer */}
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 mt-1">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 leading-relaxed">
            <strong>Privacy:</strong> Your API key is stored only in your browser's local storage.
            It is never transmitted to Rechtspraak AI servers.
          </p>
        </div>
      </div>
    </div>
  );
}

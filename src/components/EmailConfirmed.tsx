import { Scale, CheckCircle2, ArrowRight } from "lucide-react";

interface Props {
  onSwitchToSignIn: () => void;
}

export default function EmailConfirmed({ onSwitchToSignIn }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <img src="./logo.png" alt="Antilles Legal" className="w-16 h-16 rounded-2xl object-contain shadow-lg shadow-blue-500/20 mb-6" />

        <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-2xl mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Email Confirmed!</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Your email address has been verified. You can now sign in to your account.
          </p>

          <button
            onClick={onSwitchToSignIn}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-emerald-600 transition-all shadow-lg shadow-blue-500/20"
          >
            Continue to Sign In
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Scale, MailCheck, ArrowRight, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

interface Props {
  email: string;
  onSwitchToSignIn: () => void;
}

export default function EmailVerification({ email, onSwitchToSignIn }: Props) {
  const { verifyEmailOtp } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Please enter the verification code from your email.");
      return;
    }
    setLoading(true);
    const { error: verifyError } = await verifyEmailOtp(email, trimmed);
    setLoading(false);
    if (verifyError) {
      setError(verifyError);
      setCode("");
      inputRef.current?.focus();
    }
  }

  async function handleResend() {
    setResending(true);
    setResendError(null);
    setResendMessage(null);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) setResendError(error.message);
      else setResendMessage("A new verification code has been sent to your email.");
    } catch {
      setResendError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <img src="./logo.png" alt="Antilles Legal" className="w-16 h-16 rounded-2xl object-contain shadow-lg shadow-blue-500/20 mb-4" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Verify Your Email</h1>
          <p className="text-slate-400 mt-2">Enter the code we sent to your inbox</p>
        </div>

        <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
              <MailCheck className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-slate-300 mb-1">We sent a verification code to</p>
            <p className="text-base font-medium text-white break-all">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Verification Code</label>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter your code"
                className="w-full px-4 py-4 text-center text-3xl font-bold tracking-[0.4em] bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
              ) : (
                <>Verify Email <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-500 text-center">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-600 disabled:opacity-50 transition-all"
            >
              {resending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><RefreshCw className="w-4 h-4" /> Resend code</>
              )}
            </button>
          </div>

          {resendMessage && (
            <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400">
              <MailCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{resendMessage}</span>
            </div>
          )}

          {resendError && (
            <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{resendError}</span>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            Already verified?{" "}
            <button onClick={onSwitchToSignIn} className="text-blue-400 hover:underline font-medium transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

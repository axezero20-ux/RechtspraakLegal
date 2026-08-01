import { useState, useEffect } from "react";
import { Scale, MailCheck, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

interface Props {
  email: string;
  onSwitchToSignIn: () => void;
}

export default function EmailVerification({ email, onSwitchToSignIn }: Props) {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  // If the user becomes fully authenticated (email confirmed + session), show success
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      setVerified(true);
    }
  }, [user]);

  async function handleResend() {
    setResending(true);
    setResendError(null);
    setResendMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        setResendError(error.message);
      } else {
        setResendMessage("A new confirmation link has been sent to your email.");
      }
    } catch {
      setResendError("Failed to resend confirmation email. Please try again.");
    } finally {
      setResending(false);
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="relative w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-2xl mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Email Verified!</h1>
          <p className="text-slate-400 mb-8">
            Your email has been confirmed. You can now sign in to your account.
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl shadow-lg shadow-blue-500/20 mb-4">
            <Scale className="w-9 h-9 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Verify Your Email</h1>
          <p className="text-slate-400 mt-2">One last step before you can sign in</p>
        </div>

        <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
              <MailCheck className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-slate-300 mb-2">
              We've sent a confirmation link to
            </p>
            <p className="text-base font-medium text-white mb-4 break-all">{email}</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Click the link in the email to verify your account. Once verified, you'll be able to sign in.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-500 text-center">Didn't receive the email?</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-600 disabled:opacity-50 transition-all"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resending...
                </>
              ) : (
                "Resend confirmation email"
              )}
            </button>
          </div>

          {resendMessage && (
            <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
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
            <button
              onClick={onSwitchToSignIn}
              className="text-blue-400 hover:underline font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

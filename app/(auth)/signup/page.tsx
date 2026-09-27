"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/client/supabase";
import { Button } from "@/components/ui/button";
import { LooseNotionLogo } from "@/components/ui/LooseNotionLogo";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 bg-[#0e0e11] text-zinc-100">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 26 }}
        className="w-full max-w-sm"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[#161619]/90 p-7 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md overflow-hidden shadow-sm">
              <LooseNotionLogo className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Create workspace</h1>
          </div>

          <p className="mb-5 text-xs text-zinc-400">Get started with your free LooseNotion workspace.</p>

          {/* Maintenance Notice Banner */}
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-left">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-amber-300 tracking-tight">
                  Email Sign-Up Temporarily Paused
                </h2>
                <p className="text-[11px] text-amber-200/80 mt-1 leading-relaxed">
                  Email OTP verification is offline for maintenance. Please use Google / Gmail below to sign up and access your vault instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Google Sign Up Primary Action */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-medium text-xs shadow-lg flex items-center justify-center gap-2.5 transition-all"
            >
              {googleLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-black" /> Connecting to Google...
                </span>
              ) : (
                <span className="flex items-center gap-2 font-semibold">
                  <GoogleIcon className="h-4 w-4" /> Sign up with Google
                </span>
              )}
            </Button>
          </motion.div>

          <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-zinc-500">
            <Sparkles className="h-3 w-3 text-zinc-400" />
            <span>Instant setup • No password needed</span>
          </div>

          <p className="mt-4 text-center text-[11px] text-zinc-500 leading-relaxed px-2">
            By signing up, you agree to LooseNotion&apos;s{" "}
            <Link href="/terms" className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors">
              Privacy Policy
            </Link>
            .
          </p>

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: [0, -4, 4, -4, 0] }}
              transition={{ duration: 0.3 }}
              className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2"
            >
              {error}
            </motion.p>
          )}

          <p className="mt-6 text-center text-xs text-zinc-500 border-t border-white/5 pt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-zinc-300 hover:text-white underline underline-offset-4 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

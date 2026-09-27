"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/client/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "auth-code-error") {
      setError("Authentication failed or was canceled. Please try again.");
    }
  }, [searchParams]);

  async function handleGoogleSignIn() {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/workspace");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#161619]/90 p-7 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md overflow-hidden shadow-sm">
          <LooseNotionLogo className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">LooseNotion</h1>
      </div>

      <p className="mb-6 text-xs text-zinc-400">Welcome back to your workspace.</p>

      {/* Google Sign In Option */}
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          variant="outline"
          className="w-full h-10 border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-xs shadow-sm flex items-center justify-center gap-2.5 transition-colors"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          <span>Continue with Google</span>
        </Button>
      </motion.div>

      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <span className="relative bg-[#161619] px-2 text-[11px] text-zinc-500 uppercase tracking-wider">
          or continue with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <motion.div whileFocus={{ scale: 1.01 }}>
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-black/30 border-white/10 text-xs h-10 focus-visible:ring-1 focus-visible:ring-white/30"
            required
          />
        </motion.div>
        <motion.div whileFocus={{ scale: 1.01 }}>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black/30 border-white/10 text-xs h-10 focus-visible:ring-1 focus-visible:ring-white/30"
            required
          />
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: [0, -4, 4, -4, 0] }}
            transition={{ duration: 0.3 }}
            className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md p-2"
          >
            {error}
          </motion.p>
        )}

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full h-10 bg-white text-black hover:bg-zinc-200 font-medium text-xs shadow-md mt-1"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </motion.div>
      </form>

      <p className="mt-5 text-center text-xs text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-zinc-300 hover:text-white underline underline-offset-4 font-medium transition-colors">

          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
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

        <Suspense fallback={<div className="h-64 rounded-2xl border border-white/10 bg-[#161619]/90 p-7" />}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-zinc-500">
          <Link href="/privacy" className="hover:text-zinc-400 transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-zinc-400 transition-colors">
            Terms of Service
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

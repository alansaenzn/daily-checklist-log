"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignInPage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [ready, setReady] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) alert(error.message);
    else setSent(true);
    setMagicLoading(false);
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) alert(error.message);
    setGoogleLoading(false);
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {!ready ? (
        <p>Preparing sign-in…</p>
      ) : sent ? (
        <p>Check your email for the magic link.</p>
      ) : (
        <form onSubmit={signIn} className="space-y-3">
          <input
            className="w-full rounded border p-2"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="w-full rounded bg-black text-white p-2 disabled:opacity-60"
            disabled={magicLoading}
          >
            {magicLoading ? "Sending…" : "Send magic link"}
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex-1 border-t" />
            <span>or</span>
            <span className="flex-1 border-t" />
          </div>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full rounded border p-2 hover:bg-gray-50 disabled:opacity-60"
            disabled={googleLoading}
          >
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>
        </form>
      )}
    </main>
  );
}

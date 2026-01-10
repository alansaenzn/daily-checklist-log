"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignInPage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      // Clear any existing session so a new email logs into a fresh account
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;

      if (user) {
        await supabase.auth.signOut();
      }

      if (active) setReady(true);
    })();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) alert(error.message);
    else setSent(true);
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
          <button className="w-full rounded bg-black text-white p-2">
            Send magic link
          </button>
        </form>
      )}
    </main>
  );
}

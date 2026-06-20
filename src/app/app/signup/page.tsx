"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INPUT_STYLE = { background: "oklch(0.185 0.015 245)", border: "1px solid oklch(1 0 0 / 0.12)", color: "#fff" };

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[400px] text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "oklch(0.75 0.17 150 / 0.15)" }}>
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" style={{ color: "oklch(0.75 0.17 150)" }}>
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <h1 className="text-[28px] tracking-[-0.02em] text-white">Check your email</h1>
          <p className="mt-3 text-[15px] text-white/45 leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-[500] text-white/80">{email}</span>.
            Click it to activate your account.
          </p>
          <Link href="/app/login"
            className="mt-8 inline-block text-[14px] font-[500] text-white/50 underline underline-offset-4 hover:text-white/80 transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex items-center justify-end px-8 py-5">
        <span className="text-[14px] text-white/40">
          Already have an account?{" "}
          <Link href="/app/login"
            className="font-[500] text-white/70 underline underline-offset-4 hover:text-white transition-colors">
            Sign in
          </Link>
        </span>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-[32px] tracking-[-0.02em] text-white">Get started free</h1>
            <p className="mt-2 text-[15px] text-white/45 leading-relaxed">
              Create your account to access private AI and start earning with your GPU.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-[500] text-white/55">Email</label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-[6px] px-3.5 py-2.5 text-[15px] placeholder:text-white/20 outline-none transition"
                style={INPUT_STYLE}
                onFocus={(e) => (e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.30)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.12)")}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-[500] text-white/55">Password</label>
              <input
                id="password" type="password" autoComplete="new-password" required minLength={8}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-[6px] px-3.5 py-2.5 text-[15px] placeholder:text-white/20 outline-none transition"
                style={INPUT_STYLE}
                onFocus={(e) => (e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.30)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.12)")}
              />
            </div>

            {error && (
              <div className="rounded-[6px] px-4 py-3"
                style={{ background: "oklch(0.72 0.18 35 / 0.10)", border: "1px solid oklch(0.72 0.18 35 / 0.30)" }}>
                <p className="text-[13px] text-white/70">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="gl-btn-primary cursor-pointer w-full disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

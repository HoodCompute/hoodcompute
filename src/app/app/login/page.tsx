"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INPUT_STYLE = { background: "oklch(0.185 0.015 245)", border: "1px solid oklch(1 0 0 / 0.12)", color: "#fff" };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex items-center justify-end px-8 py-5">
        <span className="text-[14px] text-white/40">
          No account?{" "}
          <Link href="/app/signup" className="font-[500] text-white/70 underline underline-offset-4 hover:text-white transition-colors">
            Sign up
          </Link>
        </span>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h1 className="text-[32px] tracking-[-0.02em] text-white">Welcome back</h1>
            <p className="mt-2 text-[15px] text-white/45">Sign in to your HoodCompute account.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-[13px] font-[500] text-white/55">Password</label>
                <Link href="/app/forgot-password" className="text-[13px] text-white/30 hover:text-white/60 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

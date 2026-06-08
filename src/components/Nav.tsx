"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { XLogo } from "./icons";

const NAV_ITEMS = [
  { label: "Features", href: "/#features" },
  { label: "Use Cases", href: "/#use-cases" },
  { label: "Docs", href: "https://docs.hoodcompute.com" },
  { label: "GitHub", href: "https://github.com/hoodcompute" },
  { label: <XLogo className="h-4 w-4" />, href: "https://x.com/hoodcompute" },
];

export function Nav() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setSignedIn(!!user));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSignedIn(false);
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      id="navigation"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[1025] w-[calc(100%-2rem)] max-w-[1200px] rounded-2xl border border-white/10 bg-[var(--surface-dark-2)] shadow-lg shadow-black/40"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[64px] max-w-[1200px] justify-center items-center px-6">
        <Link href="/" aria-label="HoodCompute home" className="inline-flex shrink-0 left-6 items-center gap-3 absolute">
          <Image src="/images/logo.png" alt="HoodCompute" width={200} height={200} className="h-12 w-12 object-contain" priority />
          <span className="text-[26px] tracking-tight font-heading text-white">HoodCompute</span>
        </Link>

        <ul className="hidden items-center gap-10 lg:flex">
          {NAV_ITEMS.map((item, idx) => (
            <li key={idx}>
              <Link
                href={item.href}
                className="text-[15px] font-[440] text-white/60 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto absolute right-6 flex items-center gap-6">
          {signedIn ? (
            <>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-[4px] py-2 text-[15px] font-[440] text-white/60 transition-colors hover:text-white"
              >
                Sign out
              </button>

              <Link href="/app" className="nav-btn-cta">
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/app"
                className="rounded-[4px] py-2 text-[15px] font-[440] text-white/60 transition-colors hover:text-white"
              >
                Sign in
              </Link>

              <Link href="/app" className="nav-btn-cta">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

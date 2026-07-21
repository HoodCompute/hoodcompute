"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppHeader } from "@/components/app/AppHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="dark flex h-screen gap-3 overflow-hidden p-3 [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans [&_h4]:font-sans [&_h5]:font-sans [&_h6]:font-sans"
      style={{ background: "oklch(0.165 0.015 245)" }}
    >
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main
          className="flex-1 overflow-hidden rounded-2xl border"
          style={{
            background: "var(--surface-dark)",
            borderColor: "oklch(1 0 0 / 0.08)",
            boxShadow: "0 1px 3px oklch(0 0 0 / 0.35)",
          }}
        >
          <div className="h-full overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

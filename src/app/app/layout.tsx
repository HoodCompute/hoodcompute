import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";
import { BalanceProvider } from "@/context/BalanceContext";
import { CreditsProvider } from "@/context/CreditsContext";

export const metadata: Metadata = {
  title: "HoodCompute",
  description: "Decentralized AI compute on Robinhood Chain.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BalanceProvider>
      <CreditsProvider>
        <AppShell>{children}</AppShell>
      </CreditsProvider>
    </BalanceProvider>
  );
}

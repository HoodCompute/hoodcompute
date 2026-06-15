"use client";

import { useState } from "react";

const CARD = { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" };
const BORDER = { borderColor: "oklch(1 0 0 / 0.08)" };
const STATUS_OPTIONS = ["all", "completed", "running", "pending"] as const;

type DemoJob = {
  id: string;
  model: string;
  status: "completed" | "running" | "pending";
  tokens: number;
  credits: number;
  txHash: string;
  block: number;
  age: string;
};

const DEMO_JOBS: DemoJob[] = [
  { id: "1", model: "Qwen3 8B", status: "completed", tokens: 612, credits: 2, txHash: "0x8f2c1a9e7b6d3f0521a44c9e8b7f6d3a2c1e0f9b8a7c6d5e4f3a2b1c0d9e8f7a", block: 4821334, age: "2m ago" },
  { id: "2", model: "Llama 3.1 70B", status: "completed", tokens: 1204, credits: 6, txHash: "0x3a7d9e2c1b8f6a4d0e5c3b9a8f7d6e5c4b3a2918f7e6d5c4b3a2918f7e6d5c4", block: 4821298, age: "14m ago" },
  { id: "3", model: "DeepSeek V3", status: "running", tokens: 0, credits: 10, txHash: "", block: 0, age: "just now" },
  { id: "4", model: "Mistral Large", status: "pending", tokens: 0, credits: 8, txHash: "", block: 0, age: "1m ago" },
];

function StatusBadge({ status }: { status: DemoJob["status"] }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    completed: { label: "Completed", bg: "oklch(0.7 0.17 150 / 0.15)", color: "oklch(0.75 0.17 150)" },
    running: { label: "Running", bg: "oklch(0.60 0.18 250 / 0.15)", color: "oklch(0.74 0.15 250)" },
    pending: { label: "Pending", bg: "oklch(1 0 0 / 0.08)", color: "oklch(1 0 0 / 0.50)" },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-[500]" style={{ background: s.bg, color: s.color }}>
      <span className="h-1 w-1 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function JobsPreview() {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [expandedId, setExpandedId] = useState<string | null>("1");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const jobs = DEMO_JOBS.filter((j) => statusFilter === "all" || j.status === statusFilter);

  async function copyHash(job: DemoJob) {
    if (!job.txHash) return;
    try {
      await navigator.clipboard.writeText(job.txHash);
    } catch {
      // clipboard may be unavailable in this context; the copied state still gives feedback
    }
    setCopiedId(job.id);
    setTimeout(() => setCopiedId((prev) => (prev === job.id ? null : prev)), 1500);
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden p-4 text-left sm:p-6" style={{ background: "var(--surface-dark)" }}>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Total jobs", value: DEMO_JOBS.length.toString() },
          { label: "Completed", value: DEMO_JOBS.filter((j) => j.status === "completed").length.toString() },
          { label: "Credits spent", value: DEMO_JOBS.reduce((s, j) => s + j.credits, 0).toString() },
        ].map((s) => (
          <div key={s.label} className="rounded-[8px] p-3" style={CARD}>
            <p className="text-[9px] font-[500] uppercase tracking-widest text-white/30">{s.label}</p>
            <p className="mt-1 font-mono text-[17px] font-[500] leading-none text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-1 flex-col overflow-hidden rounded-[10px]" style={CARD}>
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b px-3 py-2 [scrollbar-width:none]" style={BORDER}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-[500] capitalize transition ${
                statusFilter === s ? "bg-white/[0.12] text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex-1 divide-y overflow-y-auto" style={BORDER}>
          {jobs.map((job) => (
            <div key={job.id}>
              <button
                onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-white/[0.03]"
              >
                <span className="min-w-0 truncate text-[12px] font-[500] text-white/90">{job.model}</span>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden font-mono text-[11px] text-white/40 sm:inline">{job.credits} cr</span>
                  <StatusBadge status={job.status} />
                </div>
              </button>

              {expandedId === job.id && job.txHash && (
                <div className="border-t px-3 py-2.5" style={{ background: "oklch(0.185 0.015 245)", borderColor: "oklch(1 0 0 / 0.06)" }}>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <p className="uppercase tracking-widest text-white/25">Tokens</p>
                      <p className="mt-0.5 font-mono text-white/70">{job.tokens.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-widest text-white/25">Block</p>
                      <p className="mt-0.5 font-mono text-white/70">{job.block.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-[6px] px-2.5 py-2" style={{ background: "oklch(1 0 0 / 0.03)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
                    <p className="flex-1 truncate font-mono text-[10px] text-white/40">{job.txHash}</p>
                    <button
                      onClick={() => copyHash(job)}
                      className="shrink-0 rounded-[5px] px-2 py-1 text-[10px] font-[500] text-white/40 transition hover:text-white/80"
                      style={{ border: "1px solid oklch(1 0 0 / 0.10)" }}
                    >
                      {copiedId === job.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

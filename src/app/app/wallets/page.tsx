"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/app/Modal";

type Wallet = {
  id: string;
  label: string;
  agent_type: string;
  balance: number;
  allocated: number;
  policy: string;
  status: string;
  address: string;
  created_at: string;
  user_id: string;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-[oklch(0.7_0.17_150)]/15 text-[oklch(0.7_0.17_150)]",
  idle: "bg-white/[0.06] text-white/50",
  "policy-violation": "bg-[oklch(0.72_0.18_35)]/15 text-[oklch(0.72_0.18_35)]",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-[oklch(0.65_0.17_150)]",
  idle: "bg-white/20",
  "policy-violation": "bg-[oklch(0.72_0.18_35)]",
};

const card = { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.08)" };
const borderStyle = { borderColor: "oklch(1 0 0 / 0.08)" };
const inputStyle = { background: "oklch(0.245 0.018 244)", border: "1px solid oklch(1 0 0 / 0.10)" };
const inputClass = "rounded-[6px] px-3 py-2.5 text-[14px] text-white placeholder:text-white/30 outline-none transition w-full";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function mockAddress(id: string) {
  const chars = "0123456789abcdef";
  let addr = "0x";
  for (let i = 0; i < 40; i++) {
    addr += chars[(id.charCodeAt(i % id.length) + i * 7) % chars.length];
  }
  return addr;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Wallet | null>(null);
  const [showProvision, setShowProvision] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [form, setForm] = useState({ label: "", agent_type: "Research", allocated: "", policy: "" });
  const [provisioning, setProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [policies, setPolicies] = useState<{ id: string; name: string }[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  const supabase = createClient();

  const fetchPolicies = useCallback(async () => {
    setPoliciesLoading(true);
    const { data } = await supabase.from("policies").select("id, name").order("name", { ascending: true });
    if (data) {
      setPolicies(data);
      setForm((f) => ({ ...f, policy: f.policy || data[0]?.name || "" }));
    }
    setPoliciesLoading(false);
  }, [supabase]);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("wallets").select("*").order("created_at", { ascending: false });
    if (!error && data) setWallets(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWallets(); }, [fetchWallets]);

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    setProvisioning(true);
    setProvisionError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProvisionError("Not authenticated."); setProvisioning(false); return; }
    const allocated = parseFloat(form.allocated) || 0;
    const { error } = await supabase.from("wallets").insert({
      label: form.label, agent_type: form.agent_type, allocated, balance: allocated,
      policy: form.policy, status: "active", user_id: user.id,
    });
    if (error) { setProvisionError(error.message); setProvisioning(false); return; }
    setForm({ label: "", agent_type: "Research", allocated: "", policy: policies[0]?.name || "" });
    setShowProvision(false);
    setProvisioning(false);
    fetchWallets();
  }

  const filtered = wallets.filter((w) => {
    const matchSearch = !search || w.label.toLowerCase().includes(search.toLowerCase()) || w.agent_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex h-full">
      {/* Main list */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ background: "oklch(0.185 0.015 245)", ...borderStyle }}>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search wallets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-[6px] px-3 py-1.5 text-[13px] text-white placeholder:text-white/30 outline-none w-48"
              style={inputStyle}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-[6px] px-2.5 py-1.5 text-[13px] text-white outline-none"
              style={inputStyle}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="policy-violation">Policy violation</option>
            </select>
          </div>
          <button onClick={() => { setShowProvision(true); fetchPolicies(); }} className="gl-btn-primary !text-[13px] !py-2 !px-4">
            + Provision wallet
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading && <div className="flex items-center justify-center py-20 text-[14px] text-white/40">Loading wallets...</div>}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[14px] font-[500] text-white">No wallets yet</p>
              <p className="mt-1 text-[13px] text-white/40">Provision your first agent wallet to get started.</p>
              <button onClick={() => { setShowProvision(true); fetchPolicies(); }} className="gl-btn-primary mt-6 !text-[13px] !py-2 !px-4">
                + Provision wallet
              </button>
            </div>
          )}

          {!loading && filtered.map((w) => {
            const addr = mockAddress(w.id);
            const pct = w.allocated > 0 ? (w.balance / w.allocated) * 100 : 0;
            const isSelected = selected?.id === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setSelected(w)}
                className="w-full rounded-[10px] p-5 text-left transition hover:border-white/20"
                style={{ ...card, ...(isSelected ? { border: "1px solid oklch(1 0 0 / 0.3)" } : {}) }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[w.status] ?? "bg-white/20"}`} />
                    <div>
                      <p className="text-[14px] font-[500] text-white">{w.label}</p>
                      <p className="font-mono text-[11px] text-white/40 mt-0.5 truncate max-w-[280px]">{addr}</p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-[500]" style={{ background: "oklch(1 0 0 / 0.06)", color: "oklch(0.9 0.01 230)" }}>{w.policy}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-[500] capitalize ${STATUS_STYLES[w.status] ?? ""}`}>{w.status.replace("-", " ")}</span>
                        <span className="text-[11px] text-white/40">{w.agent_type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-[18px] font-[500] text-white">${w.balance.toFixed(2)}</p>
                    <p className="text-[11px] text-white/40">of ${w.allocated.toFixed(2)} allocated</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[340px] shrink-0 overflow-y-auto border-l" style={{ background: "oklch(0.245 0.018 244)", ...borderStyle }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={borderStyle}>
            <h3 className="text-[14px] font-[500] text-white">{selected.label}</h3>
            <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white transition-colors">
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div className="rounded-[8px] p-4" style={{ background: "oklch(0.27 0.02 244)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
              <p className="text-[11px] font-[500] uppercase tracking-widest text-white/30">USDG balance</p>
              <p className="mt-1 font-mono text-[32px] font-[500] text-white leading-none">${selected.balance.toFixed(2)}</p>
              <p className="mt-1 text-[12px] text-white/40">of ${selected.allocated.toFixed(2)} allocated</p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Wallet ID", value: selected.id.slice(0, 12) + "..." },
                { label: "Status", value: selected.status.replace("-", " "), capitalize: true },
                { label: "Policy", value: selected.policy },
                { label: "Type", value: selected.agent_type },
                { label: "Created", value: formatDate(selected.created_at) },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0" style={{ borderColor: "oklch(1 0 0 / 0.06)" }}>
                  <span className="text-[12px] text-white/40">{row.label}</span>
                  <span className={`font-mono text-[12px] font-[500] text-white ${row.capitalize ? "capitalize" : ""}`}>{row.value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-1.5 text-[12px] font-[500] text-white/40">Robinhood Chain address</p>
              <div className="flex items-center gap-2 rounded-[6px] px-3 py-2" style={{ border: "1px solid oklch(1 0 0 / 0.08)", background: "oklch(1 0 0 / 0.04)" }}>
                <p className="flex-1 truncate font-mono text-[11px] text-white/60">{mockAddress(selected.id)}</p>
                <button onClick={() => navigator.clipboard.writeText(mockAddress(selected.id))} className="shrink-0 text-white/40 hover:text-white transition-colors">
                  <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                    <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 rounded-[6px] py-2 text-[13px] font-[500] text-white/70 transition hover:bg-white/[0.04] hover:text-white" style={{ border: "1px solid oklch(1 0 0 / 0.12)" }}>
                Fund wallet
              </button>
              <button className="flex-1 rounded-[6px] py-2 text-[13px] font-[500] transition" style={{ background: "oklch(0.72 0.18 35 / 0.10)", color: "oklch(0.72 0.18 35)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.72 0.18 35 / 0.20)")} onMouseLeave={(e) => (e.currentTarget.style.background = "oklch(0.72 0.18 35 / 0.10)")}>
                Freeze
              </button>
            </div>

            <a
              href={`https://robinhoodchain.blockscout.com/address/${mockAddress(selected.id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] text-white/40 underline underline-offset-4 hover:text-white transition-colors"
            >
              View on Blockscout
              <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
                <path d="M5 3h8v8M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Provision modal */}
      <Modal open={showProvision} onClose={() => { setShowProvision(false); setProvisionError(null); }} className="max-w-[420px]">
        <div className="flex items-center justify-between border-b px-6 py-4" style={borderStyle}>
          <h3 className="text-[16px] font-[500] text-white">Provision wallet</h3>
          <button onClick={() => { setShowProvision(false); setProvisionError(null); }} className="text-white/40 hover:text-white transition-colors">
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleProvision} className="p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-[500] text-white/70">Agent label</label>
            <input type="text" required placeholder="e.g. Research Agent v3" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-[500] text-white/70">Agent type</label>
            <select value={form.agent_type} onChange={(e) => setForm((f) => ({ ...f, agent_type: e.target.value }))} className={inputClass} style={inputStyle}>
              <option>Research</option><option>Orchestrator</option><option>Coding</option>
              <option>Data</option><option>Customer</option><option>Multi-agent</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-[500] text-white/70">Initial allocation (USDG)</label>
            <input type="number" required min="0" step="0.01" placeholder="e.g. 500.00" value={form.allocated} onChange={(e) => setForm((f) => ({ ...f, allocated: e.target.value }))} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-[500] text-white/70">Policy</label>
            {policiesLoading ? (
              <div className="rounded-[6px] px-3 py-2.5 text-[13px] text-white/40" style={inputStyle}>Loading policies...</div>
            ) : policies.length === 0 ? (
              <div className="rounded-[6px] px-3 py-2.5 text-[13px] text-white/40" style={inputStyle}>No policies found - create one in Settings first.</div>
            ) : (
              <select value={form.policy} onChange={(e) => setForm((f) => ({ ...f, policy: e.target.value }))} className={inputClass} style={inputStyle}>
                {policies.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            )}
          </div>
          {provisionError && (
            <div className="rounded-[6px] px-4 py-3" style={{ background: "oklch(0.72 0.18 35 / 0.10)", border: "1px solid oklch(0.72 0.18 35 / 0.40)" }}>
              <p className="text-[13px]" style={{ color: "oklch(0.72 0.18 35)" }}>{provisionError}</p>
            </div>
          )}
          <button type="submit" disabled={provisioning} className="gl-btn-primary w-full !text-[14px] disabled:opacity-60 disabled:cursor-not-allowed">
            {provisioning ? "Provisioning..." : "Provision wallet"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

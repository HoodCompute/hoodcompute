import Link from "next/link";

export default function ConfirmPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[420px] text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "oklch(0.75 0.17 150 / 0.15)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" style={{ color: "oklch(0.75 0.17 150)" }} aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h1 className="text-[30px] tracking-[-0.02em] text-white">Email confirmed</h1>
        <p className="mt-3 text-[16px] text-white/45 leading-relaxed">
          Your account is active. You can now access the HoodCompute dashboard and start using private AI or sharing your GPU.
        </p>

        <Link href="/app" className="gl-btn-primary mt-8 inline-block">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

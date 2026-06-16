import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "./icons";

export function NextStepsCta() {
  return (
    <section
      className="relative overflow-hidden py-20 lg:py-28"
      aria-labelledby="cta-heading"
      style={{ background: "black" }}
    >
      <Image
        src="/images/compute.png"
        alt=""
        fill
        aria-hidden="true"
        className="object-cover -scale-x-100"
        quality={90}
      />
      <div className="absolute inset-0" style={{ background: "oklch(0 0 0 / 0.2)" }} />

      <div className="relative ml-auto max-w-[1168px] px-6 lg:px-32 text-end">
        <h2
          id="cta-heading"
          className="ml-auto max-w-[800px] text-[44px] leading-[1.05] tracking-[-0.025em] text-white sm:text-[64px] md:text-[80px] lg:text-[96px] lg:leading-[100px] lg:tracking-[-2.88px]"
        >
          Open compute, for anyone who needs it.
        </h2>
        <p className="ml-auto mt-6 max-w-[800px] text-[18px] leading-[1.65] text-white/60 md:text-[20px]">
          Bring a GPU and start earning, or bring a question and get a private answer. There are no gatekeepers and no logs, and every payment settles on Robinhood Chain.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-end gap-x-8 gap-y-4">
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-[4px] bg-white px-5 py-[11px] text-[18px] font-[660] leading-[1.4] text-black transition-colors hover:bg-white/90"
          >
            Get started
          </Link>
          <Link
            href="mailto:contact@hoodcompute.com"
            className="inline-flex items-center gap-1 text-[18px] font-[660] text-white/70 hover:text-white transition-colors"
          >
            Talk to us
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

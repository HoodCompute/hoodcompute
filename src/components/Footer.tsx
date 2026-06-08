import Link from "next/link";
import Image from "next/image";

type LinkItem = { label: string; href: string };

const PRODUCT: LinkItem[] = [
  { label: "App", href: "/app" },
  { label: "Features", href: "/#features" },
  { label: "Use cases", href: "/#use-cases" },
  { label: "Typescript SDK", href: "https://www.npmjs.com/package/@hoodcompute/sdk" },

];

const DEVELOPERS: LinkItem[] = [
  { label: "Quickstart", href: "https://docs.hoodcompute.com/quickstart" },
  { label: "API reference", href: "https://docs.hoodcompute.com/api-reference/authentication" },
  { label: "Webhooks", href: "https://docs.hoodcompute.com/api-reference/webhooks" },
  { label: "LangChain tool", href: "https://docs.hoodcompute.com/integrations/langchain" },
];

const RESOURCES: LinkItem[] = [
  { label: "Documentation", href: "https://docs.hoodcompute.com" },
  { label: "Core concepts", href: "https://docs.hoodcompute.com/core-concepts" },
  { label: "Privacy", href: "https://docs.hoodcompute.com/core-concepts/privacy" },
  { label: "Architecture", href: "https://docs.hoodcompute.com/architecture" },
];

const COMPANY: LinkItem[] = [
  { label: "X / @hoodcompute", href: "https://x.com/hoodcompute" },
  { label: "GitHub", href: "https://github.com/hoodcompute" },
];

export function Footer() {
  return (
    <footer
      id="be-footer"
      className="text-white"
      aria-label="Site footer"
      style={{ background: "var(--surface-dark)" }}
    >
      <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-12 lg:py-20">
        <div className="mb-10 flex items-center gap-4">
          <Link
            href="/"
            aria-label="HoodCompute home"
            className="inline-flex items-center gap-2"
          >
            <span className="text-[26px] font-heading text-white">
              HoodCompute
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Column heading="Product" links={PRODUCT} />
          <Column heading="Developers" links={DEVELOPERS} />
          <Column heading="Resources" links={RESOURCES} />
          <Column heading="More" links={COMPANY} />
        </div>

        <div className="mt-20 space-y-3 text-[14px] text-white/60">
          <p>
            Decentralized AI compute on Robinhood Chain, open to providers and users everywhere.
          </p>
          <p>© 2026 HoodCompute.</p>
        </div>
      </div>
    </footer>
  );
}

function Column({ heading, links }: { heading: string; links: LinkItem[] }) {
  return (
    <div>
      <h3
        className="mb-3 text-[18px] uppercase tracking-[0.1em] text-white/50"
      >
        {heading}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[15px] text-white/70 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

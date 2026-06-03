import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const hoodcomputeSans = localFont({
  src: "../../public/fonts/HoodComputeSans.woff2",
  display: "swap",
  variable: "--font-hoodcompute-sans",
  weight: "100 900",
});

const hoodcomputeMono = localFont({
  src: "../../public/fonts/HoodComputeMono.woff2",
  display: "swap",
  variable: "--font-hoodcompute-mono",
  weight: "100 900",
});

const instrumentSerif = localFont({
  src: "../../public/fonts/InstrumentSerif-Regular.ttf",
  display: "swap",
  variable: "--font-instrument-serif",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hoodcompute.com"),
  title: {
    default: "HoodCompute - Private AI. Decentralized Compute. On Robinhood Chain.",
    template: "%s - HoodCompute",
  },
  description:
    "The open, decentralized network for private AI inference. Use uncensored open-weight models with full prompt privacy. Share your GPU and earn USDG. Every job settled on-chain.",
  keywords: [
    "decentralized AI",
    "private AI inference",
    "GPU compute",
    "earn USDG",
    "Robinhood Chain AI",
    "open-weight models",
    "censorship-free AI",
    "Llama",
    "DeepSeek",
    "Qwen",
    "decentralized compute",
    "on-chain AI",
  ],
  authors: [{ name: "HoodCompute", url: "https://hoodcompute.com" }],
  openGraph: {
    type: "website",
    url: "https://hoodcompute.com",
    siteName: "HoodCompute",
    title: "HoodCompute - Private AI. Decentralized Compute. On Robinhood Chain.",
    description:
      "The open, decentralized network for private AI inference. Use uncensored open-weight models with full prompt privacy. Share your GPU and earn USDG. Every job settled on-chain.",
    images: [
      {
        url: "/images/og.png",
        width: 1200,
        height: 630,
        alt: "HoodCompute - Private AI. Decentralized Compute. On Robinhood Chain.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@hoodcompute",
    title: "HoodCompute - Private AI. Decentralized Compute. On Robinhood Chain.",
    description:
      "Use uncensored AI with full prompt privacy. Share your GPU and earn USDG. Every job settled on Robinhood Chain.",
    images: ["/images/og.png"],
  },
  icons: {
    icon: [{ url: "/images/logo-black.png", type: "image/png" }],
    apple: "/images/logo-black.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hoodcomputeSans.variable} ${hoodcomputeMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

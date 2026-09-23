import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// =============================================================================
// FONTS — Loaded via next/font for zero layout shift
// =============================================================================

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["opsz"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-mono",
});

// =============================================================================
// METADATA — SEO & Social
// =============================================================================

export const metadata: Metadata = {
  title: "Cowrie — Payment Links & Recurring Payments for Organizations",
  description:
    "Give your organization one place to collect, manage, and understand every contribution. Payment links, QR codes, recurring payments, and a dashboard — built for NGOs, schools, nonprofits, and communities across Africa.",
  keywords: [
    "payment links",
    "recurring payments",
    "QR code payments",
    "organization payments",
    "NGO payments",
    "Ghana payments",
    "MTN Mobile Money",
    "MoMo API",
    "Africa fintech",
    "contribution management",
    "nonprofit payments",
  ],
  authors: [{ name: "Cowrie" }],
  openGraph: {
    title: "Cowrie — Payment Links & Recurring Payments for Organizations",
    description:
      "Give your organization one place to collect, manage, and understand every contribution.",
    type: "website",
    locale: "en_GH",
    siteName: "Cowrie",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cowrie — Payment Links & Recurring Payments for Organizations",
    description:
      "Give your organization one place to collect, manage, and understand every contribution.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// =============================================================================
// ROOT LAYOUT
// =============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

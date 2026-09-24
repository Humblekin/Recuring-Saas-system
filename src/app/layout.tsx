import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import "./globals.css";

// =============================================================================
// FONTS — Self-hosted (committed woff2) via next/font/local so production
// builds never depend on fetching Google Fonts at build time.
// =============================================================================

const fraunces = localFont({
  src: "./fonts/fraunces-variable.woff2",
  display: "swap",
  weight: "100 900",
  style: "normal",
  variable: "--font-display",
});

const ibmPlexSans = localFont({
  src: "./fonts/ibm-plex-sans-variable.woff2",
  display: "swap",
  weight: "100 700",
  style: "normal",
  variable: "--font-body",
});

const ibmPlexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  variable: "--font-mono",
});

// =============================================================================
// METADATA — SEO & Social
// =============================================================================

export const metadata: Metadata = {
  title: "Kivaro — Payment Links & Recurring Payments for Organizations",
  description:
    "Recurring payments, made simple. Payment links, QR codes, recurring payments, and a dashboard — built for NGOs, schools, nonprofits, and communities across Ghana.",
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
  authors: [{ name: "Kivaro" }],
  openGraph: {
    title: "Kivaro — Recurring payments, made simple.",
    description:
      "Give your organization one place to collect, manage, and understand every contribution.",
    type: "website",
    locale: "en_GH",
    siteName: "Kivaro",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kivaro — Recurring payments, made simple.",
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
      suppressHydrationWarning
      className={`${fraunces.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("kivaro-theme");document.documentElement.dataset.theme=(t==="light"||t==="dark")?t:"dark";}catch(e){document.documentElement.dataset.theme="dark";}`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

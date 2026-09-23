import type { ReactNode } from "react";
import Link from "next/link";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-cream min-h-screen">
      <main className="section-container pt-16 pb-24 max-w-3xl">
        <Link
          href="/"
          className="text-sm text-ink-muted hover:text-ink transition-colors"
        >
          ← Back to Cowrie
        </Link>
        <article className="mt-8 text-ink [&_h1]:font-display [&_h1]:text-3xl [&_h1]:mb-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:text-ink-muted [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:text-ink-muted [&_li]:mb-2">
          {children}
        </article>
      </main>
    </div>
  );
}
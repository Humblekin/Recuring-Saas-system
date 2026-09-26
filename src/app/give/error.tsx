"use client";

// =============================================================================
// PUBLIC GIVING ERROR BOUNDARY — shows a calm, branded screen when a give page
// fails to render (production otherwise surfaces a cryptic "Minified React
// error #441"). Never exposes stack traces or provider details; money is never
// deducted when this page appears (a payment can only complete via a verified
// provider response).
// =============================================================================

export default function GiveError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-cream border border-border p-8 rounded-3xl text-center shadow-sm">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>

        <h2 className="text-2xl font-medium mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Something went wrong
        </h2>
        <p className="text-ink-muted mb-8">
          We hit a problem loading this page. If you were making a payment, no money has been taken. Try again, or
          contact the organization directly.
        </p>

        <button
          type="button"
          onClick={reset}
          className="block w-full py-3 rounded-xl bg-ink text-cream font-medium no-underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
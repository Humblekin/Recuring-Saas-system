import type { ReactNode } from "react";

/**
 * Shared frame for the Login and Register forms.
 *
 * On mobile the form sits in a single quiet card so it reads as one object on
 * a phone-width screen. From `lg` up the card dissolves (border, fill, padding
 * and radius all reset) because the branding panel is already carrying the
 * layout there — desktop keeps the original flush presentation.
 *
 * The entrance is a CSS animation, not a JS-driven one, on purpose: the markup
 * ships fully visible and the animation is purely additive, so a slow or failed
 * bundle can never leave an auth form stuck at opacity 0. Login and Register
 * share this component with identical timing, so moving between the two routes
 * reads as one continuous motion rather than two separately-animated pages.
 * `prefers-reduced-motion` is handled globally in globals.css.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-card w-full rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-7 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      {children}
    </div>
  );
}

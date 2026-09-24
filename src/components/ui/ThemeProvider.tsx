"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

const STORAGE_KEY = "kivaro-theme";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initial value is "dark" so the server render and the first client render
  // match exactly (no hydration mismatch). The inline <head> bootstrap script
  // already set <html data-theme> before first paint, so there is no flash.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const initial = readStoredTheme();
    document.documentElement.dataset.theme = initial;
    setTheme(initial); // eslint-disable-line react-hooks/set-state-in-effect -- one-time sync of React state to the DOM/localStorage external system
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage may be unavailable (private mode); theme still applies for
        // the session via the data-theme attribute above.
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="group fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-2xl border border-border-strong bg-surface text-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-secondary transition-transform group-hover:rotate-12" />
      ) : (
        <Moon className="h-5 w-5 text-primary transition-transform group-hover:-rotate-6" />
      )}
    </button>
  );
}

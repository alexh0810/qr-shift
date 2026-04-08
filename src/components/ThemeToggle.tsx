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
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-surface border border-surfacestroke shadow-2xl hover:scale-110 active:scale-95 transition-all group"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-6 h-6 text-yellow-400 group-hover:rotate-45 transition-transform" />
      ) : (
        <Moon className="w-6 h-6 text-primary group-hover:-rotate-12 transition-transform" />
      )}
    </button>
  );
}

"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
    window.setTimeout(() => root.classList.remove("theme-transition"), 280);
  }, [resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <button type="button" className="titlebar-button" aria-label="Toggle theme">
        <Sun className="h-[1.1rem] w-[1.1rem]" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="titlebar-button relative"
      onClick={toggle}
      aria-label="Toggle theme"
      title={resolvedTheme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all duration-[250ms] dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all duration-[250ms] dark:rotate-0 dark:scale-100" />
    </button>
  );
}

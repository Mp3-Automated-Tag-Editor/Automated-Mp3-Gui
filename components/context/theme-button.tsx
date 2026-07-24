"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { setAppTheme } from "@/lib/theme";

export default function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setAppTheme(setTheme, next);
  }, [resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <button
        type="button"
        className="titlebar-button titlebar-button-theme"
        aria-label="Toggle theme"
      >
        <Sun className="titlebar-theme-sun h-[1.1rem] w-[1.1rem]" />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="titlebar-button titlebar-button-theme relative"
      onClick={toggle}
      aria-label="Toggle theme"
      title={resolvedTheme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      <Sun className="titlebar-theme-sun h-[1.1rem] w-[1.1rem] rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="titlebar-theme-moon absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
    </button>
  );
}

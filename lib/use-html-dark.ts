"use client";

import { useEffect, useState } from "react";
import { readHtmlIsDark } from "@/lib/theme";

/**
 * Tracks `html.dark` via MutationObserver so JS-driven colors
 * update in sync with the class paint (not one tick behind useTheme).
 */
export function useHtmlDark(): { mounted: boolean; isDark: boolean } {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(readHtmlIsDark());
    sync();
    setMounted(true);

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return { mounted, isDark };
}

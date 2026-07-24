/** App theme values accepted by next-themes `setTheme`. */
export type AppTheme = "light" | "dark" | "system";

/**
 * Shared theme setter so titlebar toggle and Appearance settings
 * always flip the theme the same way (atomic, no partial CSS fades).
 */
export function setAppTheme(
  setTheme: (theme: string) => void,
  theme: AppTheme
): void {
  setTheme(theme);
}

/** Whether `<html>` currently has the `dark` class. */
export function readHtmlIsDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

/** Full "Mp3" wordmark for expanded sidebar / branding. */
export function logoFullSrc(isDark: boolean): string {
  return isDark ? "/full_black.png" : "/full_white.png";
}

/** Compact mark for collapsed sidebar / avatars. */
export const LOGO_MARK_SRC = "/logo.png";

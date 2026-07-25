"use client";

import Link from "next/link";
import Image from "next/image";
import { Info, Settings2, AlignJustify, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { LOGO_MARK_SRC, logoFullSrc } from "@/lib/theme";
import { useHtmlDark } from "@/lib/use-html-dark";
import { Separator } from "./ui/separator";
import { CONFIG_KEYS, ROUTES, sidebarRoutes } from "@/constants";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "@/components/context/ConfigContext";

/** Sidebar width uses duration-300; open logo waits for midpoint, close swaps sooner. */
const SIDEBAR_WIDTH_MS = 300;
const LOGO_OPEN_DELAY_MS = SIDEBAR_WIDTH_MS / 2;
const LOGO_CLOSE_DELAY_MS = 40;

const navItemBase =
  "whitespace-nowrap duration-300 text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

const navItemActive =
  "bg-sidebar-accent text-sidebar-accent-foreground";

function isRouteActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/" || pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const Sidebar = ({
  isSidebarOpen,
  toggleSidebar,
}: {
  isSidebarOpen: boolean;
  toggleSidebar: any;
}) => {
  const pathname = usePathname();
  const { isDark } = useHtmlDark();
  const { configs } = useContext(ConfigContext);
  const forceDarkSidebar = Boolean(configs[CONFIG_KEYS.darkSidebar]);
  const effectiveDark = forceDarkSidebar || isDark;
  const wordmarkSrc = logoFullSrc(effectiveDark);

  // Logo swap: delayed on open (mid sidebar), near-immediate on close
  const [logoOpen, setLogoOpen] = useState(isSidebarOpen);
  useEffect(() => {
    const delay = isSidebarOpen ? LOGO_OPEN_DELAY_MS : LOGO_CLOSE_DELAY_MS;
    const id = window.setTimeout(() => setLogoOpen(isSidebarOpen), delay);
    return () => window.clearTimeout(id);
  }, [isSidebarOpen]);

  return (
    <div
      className={cn(
        "flex h-full flex-col space-y-4 border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground",
        forceDarkSidebar && "sidebar-force-dark"
      )}
    >
      <div className="flex-1 px-3 py-2">
        <Link
          href={ROUTES.dashboard}
          className="mb-4 flex w-full justify-center whitespace-nowrap p-3 pl-3"
        >
          <div className="relative flex h-20 w-full items-center justify-center">
            {/* Expanded wordmark — fixed size, opacity only */}
            <div
              className={cn(
                "absolute h-20 w-44 transition-opacity duration-200 ease-out",
                logoOpen
                  ? "opacity-100"
                  : "pointer-events-none opacity-0 duration-100"
              )}
            >
              <Image
                fill
                alt="Logo"
                src={wordmarkSrc}
                className="object-cover"
                sizes="176px"
                priority
              />
            </div>
            {/* Collapsed mark — fixed size, opacity only */}
            <div
              className={cn(
                "absolute h-10 w-10 transition-opacity ease-out",
                logoOpen
                  ? "pointer-events-none opacity-0 duration-200"
                  : "opacity-100 duration-100"
              )}
            >
              <Image
                fill
                alt="Logo"
                src={LOGO_MARK_SRC}
                className="object-cover"
                sizes="40px"
                priority
              />
            </div>
          </div>
        </Link>
        <div className="space-y-2">
          {sidebarRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                navItemBase,
                isRouteActive(pathname, route.href) && navItemActive
              )}
            >
              <div className="flex flex-1 items-center">
                <route.icon className={cn("mr-3 h-5 w-5", route.color)} />
                <span
                  className={cn(
                    "transition-opacity duration-300",
                    isSidebarOpen ? "opacity-100" : "opacity-0"
                  )}
                >
                  {route.label}
                </span>
              </div>
            </Link>
          ))}
          <Separator className="bg-violet-400" />
          <Link
            key="Settings"
            href={ROUTES.settings}
            className={cn(
              navItemBase,
              isRouteActive(pathname, ROUTES.settings) && navItemActive
            )}
          >
            <div className="flex flex-1 items-center">
              <Settings2 className="mr-3 h-5 w-5" />
              <span
                className={cn(
                  "transition-opacity duration-300",
                  isSidebarOpen ? "opacity-100" : "opacity-0"
                )}
              >
                Settings
              </span>
            </div>
          </Link>
          <Link
            key="About Us"
            href={ROUTES.aboutUs}
            className={cn(
              navItemBase,
              isRouteActive(pathname, ROUTES.aboutUs) && navItemActive
            )}
          >
            <div className="flex flex-1 items-center">
              <Info className="mr-3 h-5 w-5 text-sidebar-muted" />
              <span
                className={cn(
                  "transition-opacity duration-300",
                  isSidebarOpen ? "opacity-100" : "opacity-0"
                )}
              >
                About Us
              </span>
            </div>
          </Link>
        </div>
      </div>

      <div className="flex-col space-y-2 px-3 py-2">
        <div
          className={cn(
            navItemBase,
            "overflow-hidden transition-all",
            !isSidebarOpen && "text-sidebar-foreground"
          )}
          onClick={toggleSidebar}
        >
          <div className="flex flex-1 items-center">
            {!isSidebarOpen ? (
              <AlignJustify className="mr-3 h-5 w-5 text-sidebar-muted" />
            ) : (
              <X className="mr-3 h-5 w-5 text-red-700 dark:text-red-400" />
            )}
            <span
              className={cn(
                "transition-opacity duration-300",
                isSidebarOpen ? "opacity-100" : "opacity-0"
              )}
            >
              Close Sidebar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

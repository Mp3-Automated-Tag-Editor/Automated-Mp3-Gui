"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/sidebar-nav";
import { Heading } from "@/components/heading";
import { Settings } from "lucide-react";
import { useContext } from "react";
import { ConfigContext } from "@/components/context/ConfigContext";
import { settingsDevNavItem, settingsNavItems } from "@/constants";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { configs } = useContext(ConfigContext);

  const sidebarNavItems = [
    ...settingsNavItems,
    ...(configs.developerSettings ? [settingsDevNavItem] : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-6 px-8 pt-0">
        <Heading
          title="Settings"
          description="Manage account settings."
          icon={Settings}
          iconColor="text-gray-700"
          otherProps="shrink-0 px-0"
        />
        <Separator className="my-1" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-hidden px-8 pt-6 lg:flex-row lg:gap-12">
        <aside className="-mx-4 shrink-0 lg:mx-0 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>

        <div className="relative min-h-0 min-w-0 flex-1">
          <div className="scroll-edge-blur" aria-hidden />
          <div className="h-full min-h-0 overflow-y-auto pb-16 pr-3 lg:max-w-2xl lg:pr-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <>
      <Heading
        title="Settings"
        description="Manage account settings."
        icon={Settings}
        iconColor="text-gray-700"
      />
      <div className="space-y-6 p-8 pb-16 md:block">
        <Separator className="my-1" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  );
}

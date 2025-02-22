"use client";

import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "@/components/sidebar-nav"
import { Heading } from "@/components/heading"
import { Settings } from "lucide-react"
import { useContext, useEffect } from "react"
import { ConfigContext } from "@/components/context/ConfigContext"


interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { configs } = useContext(ConfigContext);
  
  var sidebarNavItems = [
    {
      title: "General",
      href: "/settings",
    },
    {
      title: "Account",
      href: "/settings/account",
    },
    {
      title: "Appearance",
      href: "/settings/appearance",
    },
    {
      title: "Notifications",
      href: "/settings/notifications",
    },
    ...(
      configs.developerSettings ?
    [
      {
        title: "Developer",
        href: "/settings/dev",
      }
    ] : []
    ),
  ]


  return (
    <>
      <Heading
        title="Settings"
        description="Manage account settings."
        icon={Settings}
        iconColor="text-gray-700"
      // bgColor="bg-gray-700/10"
      />
      <div className="space-y-6 p-8 pb-16 md:block">
        {/* <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </div> */}
        <Separator className="my-1" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  )
}

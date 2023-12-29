"use client";

import Link from "next/link";
import Image from "next/image";
import { Montserrat } from 'next/font/google'
import { Play, Info, LayoutDashboard, Music, Settings2, Download, Pencil } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const poppins = Montserrat({ weight: '600', subsets: ['latin'] });

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    color: "text-sky-500"
  },
  {
    label: 'Start Scraping',
    icon: Play,
    href: '/start',
    color: "text-violet-500",
  },
  {
    label: 'Download',
    icon: Download,
    color: "text-pink-700",
    href: '/download',
  },
  {
    label: 'Edit',
    icon: Pencil,
    color: "text-orange-700",
    href: '/edit',
  },
  {
    label: 'Music Playstation',
    icon: Music,
    // color: "text-emerald-500",
    color: "text-green-700",
    href: '/music',
  },
  {
    label: 'Settings',
    icon: Settings2,
    // color: "text-green-700",
    href: '/settings',
  },
];

export const Sidebar = (
  // {
  //   apiLimitCount = 0,
  //   isPro = false
  // }: {
  //   apiLimitCount: number;
  //   isPro: boolean;
  // }
) => {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#000000] text-white"> {/* bg-[#111827] */}
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <div className="relative h-20 w-20 align-baseline ">
            <Image fill alt="Logo" src="/logo.png" />
          </div>
          <h1 className={cn("text-sm font-bold", poppins.className)}>
            Automated Mp3 Tag Editor
          </h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-3 py-2 flex">
        <Link
          key={'About Us'}
          href={'/about-us'}
          className={cn(
            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
            pathname === '/about-us' ? "text-white bg-white/10" : "text-zinc-400",
          )}
        >
          <div className="flex items-center flex-1">
            <Info className={cn("h-5 w-5 mr-3", "text-zinc-400")} />
            {"About Us"}
          </div>
        </Link>
      </div>
      {/* <FreeCounter 
        apiLimitCount={apiLimitCount} 
        isPro={isPro}
      /> */}
    </div>
  );
};

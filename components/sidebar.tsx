"use client";

import Link from "next/link";
import Image from "next/image";
import { Montserrat } from 'next/font/google';
import { Play, Info, LayoutDashboard, Music, Settings2, Download, Pencil, AlignJustify, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

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
    color: "text-green-700",
    href: '/music',
  },
  // {
  //   label: 'Settings',
  //   icon: Settings2,
  //   href: '/settings',
  // },
];

const Sidebar = ({ isSidebarOpen, toggleSidebar }: { isSidebarOpen: boolean, toggleSidebar: any }) => {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#000000] text-white">
      <div className="px-3 py-2 flex-1">
        {/* <Link href="/dashboard" className="whitespace-nowrap duration-300 flex justify-center p-3 w-full pl-3 mb-4">
          <div className={`relative align-baseline rounded-lg transition-opacity duration-300 ${isSidebarOpen ? "h-20 w-40" : "h-10 w-10 mb-10" }`}>
            {isSidebarOpen ? <Image fill alt="Logo" src="/1.png" className="object-cover" /> : <Image fill alt="Logo" src="/logo.png" className="object-cover" />}
          </div>
        </Link> */}
        <Link href="/dashboard" className="whitespace-nowrap duration-300 flex justify-center p-3 w-full pl-3 mb-4">
          <div className={`relative align-baseline rounded-lg transition-all duration-500 ease-in-out ${isSidebarOpen ? "h-20 w-40" : "h-10 w-10 mb-10"}`}>
            {isSidebarOpen ? (
              <Image fill alt="Logo" src="/1.png" className="object-cover transition-opacity duration-300 ease-in-out" />
            ) : (
              <Image fill alt="Logo" src="/logo.png" className="object-cover transition-all duration-300 ease-in-out" />
            )}
          </div>
        </Link>
        <div className="space-y-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "whitespace-nowrap duration-300 text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg",
                pathname.includes(route.href)
                  ? "text-white bg-white/10"
                  : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
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
            key={'Settings'}
            href={'/settings'}
            className={cn(
              "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg",
              pathname.includes('/settings')
                ? "text-white bg-white/10"
                : "text-zinc-400"
            )}
          >
            <div className="flex items-center flex-1">
              <Settings2 className={cn("h-5 w-5 mr-3")} />
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
            key={'About Us'}
            href={'/about-us'}
            className={cn(
              "whitespace-nowrap duration-300 text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg",
              pathname.includes('/about-us') ? "text-white bg-white/10" : "text-zinc-400",
            )}
          >
            <div className="flex items-center flex-1">
              <Info className={cn("h-5 w-5 mr-3", "text-zinc-400")} />
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

      <div className="px-3 py-2 flex-col space-y-2">
        {/* <Link
          key={'About Us'}
          href={'/about-us'}
          className={cn(
            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg",
            pathname === '/about-us' ? "text-white bg-white/10" : "text-zinc-400",
          )}
        >
          <div className="flex items-center flex-1">
            <Info className={cn("h-5 w-5 mr-3", "text-zinc-400")} />
            {isSidebarOpen ? "About Us" : null}
          </div>
        </Link>
        <Separator /> */}
        <div className={cn(
          "whitespace-nowrap duration-300 text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg overflow-hidden transition-all",
          isSidebarOpen ? "text-zinc-400" : "text-white",
        )} onClick={toggleSidebar}>
          <div className="flex items-center flex-1">
            {!isSidebarOpen ? <AlignJustify className={cn("h-5 w-5 mr-3", "text-zinc-400", "text-zinc-400")} /> : <X className={cn("h-5 w-5 mr-3", "text-zinc-400", "text-red-700")} />}
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
      {/* <FreeCounter 
        apiLimitCount={apiLimitCount} 
        isPro={isPro}
      /> */}
    </div>
  );
};

export default Sidebar;

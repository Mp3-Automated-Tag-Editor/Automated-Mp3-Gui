import { Download, Music, Pencil, Play, Settings2 } from "lucide-react";

export const MAX_FREE_SONGS = 100;

export const tools = [
  {
    label: 'Start Scraping',
    icon: Play,
    href: '/start',
    color: "text-violet-500",
    // bgColor: "bg-violet-500/10",
  },
  {
    label: 'Download',
    icon: Download,
    color: "text-pink-700",
    href: '/download',
    bgColor: "bg-pink-700/10",
  },
  {
    label: 'Edit',
    icon: Pencil,
    color: "text-orange-700",
    href: '/edit',
    bgColor: "bg-orange-700/10",
  },
  {
    label: 'Music Playstation',
    icon: Music,
    color: "text-green-700",
    bgColor: "bg-green-700/10",
    href: '/music',
  },
  {
    label: 'Settings',
    icon: Settings2,
    color: "text-grey-500",
    bgColor: "bg-grey-500/10",
    href: '/settings',
  },
];

export const proTools = [
  {
    label: 'DeepScrape Pro',
    icon: Play,
    href: '/start',
    color: "text-violet-500",
    content: 'Lifetime DeepScrape Support'
    // bgColor: "bg-violet-500/10",
  },
  {
    label: 'Pro Downloads',
    icon: Download,
    color: "text-pink-700",
    href: '/download',
    bgColor: "bg-pink-700/10",
    content: 'Lifetime Download Support'
  },
];

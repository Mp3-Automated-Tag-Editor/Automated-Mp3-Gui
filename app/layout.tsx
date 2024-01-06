"use client";

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import './globals.css'
import TitleBar from '@/components/titlebar'
import { Toaster } from "@/components/ui/toaster"
import ConfigsProvider from "../components/context/ConfigContext";
// import { invoke } from '@tauri-apps/api/tauri'
import configData from "../settings/settings.json";
import { useEffect, useLayoutEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import dynamic from 'next/dynamic';
import { Settings } from 'lucide-react';
import { json } from 'stream/consumers';

const inter = Inter({ subsets: ['latin'] })

const metadata: Metadata = {
  title: 'Mp3 Automated Tag Editor',
  description: 'Automated Music Metadata Generator',
}

interface Settings {
  threads: number,
  test: string,
  developerSettings: boolean
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  let configData = {
    "test": "test",
    "threads": 2,
    "developerSettings": false
  }

  const [settingsJsonData, setSettingsJsonData] = useState({
    "test": "test",
    "threads": 2,
    "developerSettings": false
  });

  useLayoutEffect(() => {
    const getSettingsPath = async () => {
      let jsonData: Settings = await invoke('get_settings_data');
      setSettingsJsonData(jsonData)
    }
    getSettingsPath();
  }, [])

  return (
    <html lang="en">
      {/* <TitleBar titleText={""}/> */}
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TitleBar titleBar='Automated Mp3 Tag Editor - v1.0' />
        <ConfigsProvider configJson={settingsJsonData}>

          <body className={inter.className}>
            {children}
          </body>
        </ConfigsProvider>

        <Toaster />
      </ThemeProvider>
    </html>
  )
}

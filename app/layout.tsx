import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import './globals.css'
import TitleBar from '@/components/titlebar'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mp3 Automated Tag Editor',
  description: 'Automated Music Metadata Generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        <body className={inter.className}>
            {children}
        </body>
        <Toaster />
      </ThemeProvider>
    </html>
  )
}

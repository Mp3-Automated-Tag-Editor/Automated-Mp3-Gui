import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import TitleBar from "@/components/titlebar";
import { Toaster } from "@/components/ui/toaster";
import ConfigsProvider from "../components/context/ConfigContext";
import { PlayerProvider } from "@/components/context/PlayerContext";
import { DEFAULT_SETTINGS } from "@/constants";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mp3 Automated Tag Editor",
  description: "Automated Music Metadata Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="scroll-smooth"
      style={{
        scrollBehavior: "smooth",
        scrollMarginTop: "14px",
      }}
      suppressHydrationWarning
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={true}
      >
        <ConfigsProvider defaultData={DEFAULT_SETTINGS}>
          <PlayerProvider>
            <body className={`${inter.className} h-full overflow-hidden`}>
              <TitleBar />
              {children}
              <Toaster />
            </body>
          </PlayerProvider>
        </ConfigsProvider>
      </ThemeProvider>
    </html>
  );
}

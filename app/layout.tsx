import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import TitleBar from "@/components/titlebar";
import { Toaster } from "@/components/ui/toaster";
import ConfigsProvider from "../components/context/ConfigContext";
import { PlayerProvider } from "@/components/context/PlayerContext";

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
  const defaultData = {
    test: "test",
    threads: 1,
    developerSettings: false,
  };

  return (
    <html
      lang="en"
      className="scroll-smooth"
      style={{
        scrollBehavior: "smooth",
        scrollMarginTop: "14px",
        scrollbarColor: "green",
      }}
      suppressHydrationWarning
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        <ConfigsProvider defaultData={defaultData}>
          <PlayerProvider>
            <body className={inter.className}>
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

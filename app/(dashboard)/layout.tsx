"use client"

import Sidebar from "@/components/sidebar";
import { useEffect, useState } from "react";

const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const width = isSidebarOpen ? "18rem" : "4.25rem";
    document.documentElement.style.setProperty("--sidebar-width", width);
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, [isSidebarOpen]);

  const sidebarWidthClass = isSidebarOpen ? "md:w-72" : "md:w-[4.25rem]";
  const mainPadClass = isSidebarOpen ? "md:pl-72" : "md:pl-[4.25rem]";

  return (
    <>
      <div
        className={`relative z-[45] h-full transition-all duration-300 md:fixed md:inset-y-0 md:flex md:flex-col ${sidebarWidthClass}`}
      >
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>
      <main
        className={`flex h-full min-h-0 flex-col pt-10 transition-all duration-300 ${mainPadClass}`}
      >
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0 flex flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default DashboardLayout;

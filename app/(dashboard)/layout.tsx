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

  return (
    <>
      <div
        className={`relative z-[45] h-full transition-all duration-300 md:fixed md:inset-y-0 md:flex md:flex-col ${
          isSidebarOpen ? "md:w-72" : "md:w-[68px]"
        }`}
      >
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>
      <main
        className={`flex h-screen flex-col pt-10 transition-all duration-300 ${
          isSidebarOpen ? "md:pl-72" : "md:pl-20"
        }`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>
    </>
  );
}

export default DashboardLayout;

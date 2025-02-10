"use client"

import Sidebar from "@/components/sidebar";
import { useState } from "react";

const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <>
      <div className={`relative h-full md:flex md:flex-col md:fixed md:inset-y-0 z-80 z-10 transition-all duration-300 ${isSidebarOpen ? 'md:w-72' : 'md:w-[68px]'}`}>
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>
      <main className={`py-12 h-screen transition-all duration-300 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-20'}`}>
        {children}
      </main>
    </>
  );
}

export default DashboardLayout;

import Navbar from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import TitleBar from "@/components/titlebar";
// import { checkSubscription } from "@/lib/subscription";
// import { getApiLimitCount } from "@/lib/api-limit";

const DashboardLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  // const apiLimitCount = await getApiLimitCount();
  // const isPro = await checkSubscription();

  return (
    // <div className="h-full relative">
    <>
      <div className="relative hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80 bg-gray-900 z-10">
        <Sidebar />
      </div>
      {/* <Navbar /> */}
      <main className="md:pl-72 py-12">
        {children}
      </main>
    </>
    // </div>
  );
}

export default DashboardLayout;

// import { UserButton } from "@clerk/nextjs";
"use client";

import { MobileSidebar } from "@/components/mobile-sidebar";
import AvatarCircle from "./avatar";

// import { getApiLimitCount } from "@/lib/api-limit";
// import { checkSubscription } from "@/lib/subscription";

const Navbar = () => {
  // const apiLimitCount = await getApiLimitCount();
  // const isPro = await checkSubscription();

  return (
    <div className="flex items-center py-3">
      {/* <MobileSidebar isPro={isPro} apiLimitCount={apiLimitCount} /> */}
      <MobileSidebar />
      <div className="flex w-full justify-end mt-6">
        <AvatarCircle />
      </div>
    </div>
  );
}

export default Navbar;
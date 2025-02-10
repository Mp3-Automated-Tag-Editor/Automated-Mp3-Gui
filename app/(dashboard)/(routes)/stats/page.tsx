"use client";

import { BarChartHorizontalIcon } from 'lucide-react';

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";

const Stream = () => {
  return (
    <div>
      <Heading
        title="Statistics"
        description="Your Music Stats all in one place :)"
        icon={BarChartHorizontalIcon}
        iconColor="text-yellow-700"
        otherProps="mb-8"
      // bgColor="bg-violet-500/10"
      />
      <div className="justify-center align-middle">
      </div>

      <div className="px-4 lg:px-8">
        <div>
          <div className="rounded-lg 
                 
                w-full 
                p-4 
                px-3 
                md:px-6 
                focus-within:shadow-sm">
            <span className="coming-soon"><center>Coming Soon</center></span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Stream;


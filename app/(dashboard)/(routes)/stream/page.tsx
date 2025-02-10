"use client";

import { AudioLines } from "lucide-react";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";

const Stream = () => {
  return (
    <div>
      <Heading
        title="Stream & Connect"
        description="Stream your favourite music on mobile through the Auto-Mp3 App!"
        icon={AudioLines}
        iconColor="text-blue-700"
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


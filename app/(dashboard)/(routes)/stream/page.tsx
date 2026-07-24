"use client";

import { AudioLines } from "lucide-react";
import { Heading } from "@/components/heading";

const Stream = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Heading
        title="Stream & Connect"
        description="Stream your favourite music on mobile through the Auto-Mp3 App!"
        icon={AudioLines}
        iconColor="text-blue-700"
        otherProps="mb-8 shrink-0"
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 lg:px-8">
        <div className="w-full rounded-lg p-4 px-3 focus-within:shadow-sm md:px-6">
          <span className="coming-soon">
            <center>Coming Soon</center>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Stream;

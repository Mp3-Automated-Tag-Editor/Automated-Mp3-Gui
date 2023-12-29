"use client";

import { Play } from "lucide-react";

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";


const Start = () => {
  return (
    <div>
      <Heading
        title="Start Search"
        description="Our most advanced Vector based AI-indexing model for music metadata."
        icon={Play}
        iconColor="text-violet-500"
      // bgColor="bg-violet-500/10"
      />
      <div className="px-4 lg:px-8">
        <div>
          <div className="rounded-lg 
                border 
                w-full 
                p-4 
                px-3 
                md:px-6 
                focus-within:shadow-sm">
            <h5 className="text-l font-bold">Some Points to Note:</h5>
            <p className="text-sm py-4">
              <ol>
                <li>1. Make sure to select a directory which contains Mp3 files only.</li>
                <li>2. Mp3 files that contain incomplete Metadata will also be searched and indexed.</li>
                <li>3. To download indexed database, kindly turn on Developer Settings in <b>Settings</b>, as this is turned off by default.</li>
                <li>4. Make sure to configure the application, including number of threads to be used to hasten the indexing process.</li>
                <li>5. Remember, the trial allows <b>100 Deep Searches</b> only, kindly buy more credits to index more songs.</li>
              </ol>
              
            </p>
            <div className="text-sm pb-2">Happy Searching!</div>
            <div className="grid
                grid-cols-12
                gap-2 py-2">
              <Button className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                Select Directory
              </Button>
              
              <Button className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                Settings
              </Button>

              <Button className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                Start
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Start;


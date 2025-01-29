"use client";

import { message, open } from "@tauri-apps/api/dialog";
import { Download } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Start = () => {
  const router = useRouter();
  const [directory, setDirectory] = useState<any>();
  const [bitRate, setBitRate] = useState<number>(320);

  async function selectDirectory() {
    try {
      const selectedPath = await open({
        title: "Select Download location",
        directory: true,
        multiple: false,
        defaultPath: "Downloads",
      });
      if (selectedPath) {
        setDirectory(selectedPath);
      } else return;
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div>
      <Heading
        title="Download"
        description="Download your favourite music as Mp3 files, stored locally for you to use anytime, anywhere!"
        icon={Download}
        iconColor="text-pink-700"
        otherProps="mb-8"
        // bgColor="bg-violet-500/10"
      />
      <div className="justify-center align-middle"></div>

      <div className="px-4 lg:px-8">
        <div>
          <div
            className="rounded-lg 
                 border
                w-full 
                p-4 
                px-3 
                md:px-6 
                focus-within:shadow-sm"
          >
            <div className="grid md:grid-cols-2 gap-4 py-4">
              <div>
                <h5 className="text-l font-bold">Some Points to Note:</h5>
                <p className="text-sm py-4">
                  <ol>
                    <li>
                      1. You can use Spotify Playlist Links, single Spotify
                      music links, Youtube Playlists and Youtube Links for the
                      downloader.
                    </li>
                    <li>
                      2. Set a specific bitrate. In case of constraints, it will
                      default to the availble bitrate.
                    </li>
                  </ol>
                </p>
                {/* <div className="text-sm pb-2">Happy Downloading!</div> */}
                <div className="space-y-4">
                  <div className="">
                    <Label htmlFor="url">Spotify/Youtube URL:</Label>
                    <Input id="url" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bitrate">Download Bitrate (kbps): </Label>
                    <div className="flex space-x-2">
                      {[128, 192, 256, 320].map((rate) => (
                        <Button
                          key={rate}
                          variant={bitRate === rate ? "outline2" : "outline"} // Highlight selected button
                          className="h-10 w-10 p-0"
                          onClick={() => setBitRate(rate)} // Change bitrate on click
                        >
                          {rate}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Download Folder: </Label>
                    <Button
                      onClick={selectDirectory}
                      className="col-span-12 lg:col-span-3 w-full"
                      type="submit"
                      size="icon"
                      variant={directory ? "outline2" : "outline"}
                    >
                      {directory
                        ? `Selected Directory: ${directory}`
                        : "Select Directory"}
                    </Button>
                  </div>
                </div>
                {/* Add button to select download directory / create download directory */}
              </div>
              {/* <Separator orientation="vertical" className="h-full w-[1px] bg-gray-300" /> */}

              <div className="flex  items-center">
                <div className="fakeScreen h-[300px] md:h-[250px] sm:h-[200px] lg:h-[500px] xl:h-[900px]">
                  <p className="line1">
                    $ Mp3-Automated-Tag-Editor v1.3.0
                    <span className="cursor1">_</span>
                  </p>

                  <p className="line4">
                    &gt;<span className="cursor4">_</span>
                  </p>
                  <div id="snap"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Start;

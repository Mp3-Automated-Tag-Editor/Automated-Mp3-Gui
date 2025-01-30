"use client";
import { Command } from '@tauri-apps/api/shell'

import { message, open } from "@tauri-apps/api/dialog";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { invoke } from "@tauri-apps/api/tauri";
import { Dialog, DialogSessions } from "@/components/dialog";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Packet } from '@/types';
import { SimpleLine } from '@/components/terminal-items';

const DownloadMusic = () => {
  const router = useRouter();
  const [directory, setDirectory] = useState<any>();
  const [bitRate, setBitRate] = useState<number>(320);
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    data: string;
    type: number;
  }>({ title: "", data: "", type: 0 });
  const [hashmap, setHashmap] = useState<Map<number, string>>(new Map());
  const [completed, setCompleted] = useState<boolean>(false);
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  // async function startDownloadTest() {
  //   const dynamicOutputPath = './test/music';
  //   const dynamicMetadataUrl = 'https://www.youtube.com/watch?v=roYfihZ_gJ0&list=PLI7-lKwh3jzYM6xlM-R_PKW5YdNhgW1aD&index=2';

  //   // Prepare the command with dynamic arguments
  //   const command = Command.sidecar('../bin/auto-mp3-downloader.exe', [
  //     '--output', dynamicOutputPath,
  //     '--quality', (320).toString(),
  //     '--metadata', dynamicMetadataUrl
  //   ]);

  //   const output = await command.execute()
  //   console.log(output)
  // }
  useEffect(() => {
    async function listenDownloadDetails() {
      let ptr = 0;
      let _unListen: UnlistenFn = await listen("download_progress", (event) => {
        const progressData: string = JSON.parse(
          JSON.stringify(event.payload)
        );
        hashmap.set(ptr++, progressData);
        if (progressData.includes("Process Completed: ")) {
          setCompleted(true);
        }
        setHashmap(new Map(hashmap));
      });
    }

    listenDownloadDetails();
  }, []);

  async function startDownload() {
    try {
      if (!directory) {
        setErrorDetails({
          title: "No Selected Directory",
          data: "Kindly select a directory that contains music files to be scraped.",
          type: 0,
        });
        setError(true);
        return;
      }

      if (!url) {
        setErrorDetails({
          title: "No URL Provided",
          data: "Kindly select a directory that contains music files to be scraped.",
          type: 0,
        });
        setError(true);
        return;
      }

      setError(false);

      // Start download
      const val: any = await invoke("download_music", {
        path: directory,
        url: url,
        bitrate: bitRate,
      });      

    } catch (error) {
      console.log(error);
      setErrorDetails({
        title: "Error",
        data: "An error occured while trying to download the file: " + error,
        type: 0,
      });
      setError(true);
    }
  }

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
          {error === true ? (
            <>
              <Dialog
                msg={errorDetails.data}
                title={errorDetails.title}
                variant="destructive"
                type={true}
              />
              {/* <Alert initial={error} msg={errorDetails.data} header={errorDetails.title} func={setError} type={errorDetails.type} />  goBackFunc={goBack} retryFunc={retry} /> */}
            </>
          ) : null}
          {completed === true ? (
            <>
              <DialogSessions msg="Successfully downloaded your files. Click this link to go to the edit page." title="Success!" href={`/edit/editPage?directory=${directory}&totalSongs=${100}&pageNo=${1}&pageSize=${10}`} variant="none" type={false} />              
            </>
          ) : null}
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
                      1. Make sure to install the 2 dependencies - ffmpeg and spotdl. You can follow the docuemntation on how to install them here: 
                    </li>
                    <li>
                      2. You can use Spotify Playlist Links, single Spotify
                      music links, Youtube Playlists and Youtube Links for the
                      downloader.
                    </li>
                    <li>
                      3. Set a specific bitrate. In case of constraints, it will
                      default to the availble bitrate.
                    </li>
                  </ol>
                </p>
                {/* <div className="text-sm pb-2">Happy Downloading!</div> */}
                <div className="space-y-4">
                  <div className="">
                    <Label htmlFor="url">Spotify/Youtube URL:</Label>
                    <Input id="url" value={url} onChange={handleUrlChange} />
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
                    <Button
                      onClick={startDownload}
                      className="col-span-12 lg:col-span-3 w-full"
                      type="submit"
                      size="icon"
                      variant="default"
                    >
                      Start Download
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
                  {[...hashmap].map((entry) => {
                                let key = entry[0];
                                let value = entry[1];
                                return (
                                  <SimpleLine
                                    key={key}
                                    lineType={5}
                                    result={value} />
                                );
                              })}
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

export default DownloadMusic;

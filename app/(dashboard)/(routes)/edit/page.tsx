"use client";

import { Pencil } from "lucide-react";
import { Heading } from "@/components/heading";

import { useState } from "react";

import { z } from "zod"

import songDate from './data/song.json'
import { invoke } from '@tauri-apps/api/tauri'
import { songSchema } from "./data/schema"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { message, open } from '@tauri-apps/api/dialog'

const Edit = () => {
  const [directory, setDirectory] = useState<any>();
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<{ state: boolean, msg: string }>({ state: false, msg: "" });
  const [errorDetails, setErrorDetails] = useState<{ title: string, data: string, type: number }>({ title: "", data: "", type: 0 })

  const router = useRouter();

  async function selectDirectory() {
    try {
      const selectedPath = await open({
        title: "Select Music Library",
        directory: true,
        multiple: false,
        defaultPath: 'Downloads',
      });

      var msg: [boolean,number] | [boolean,string] = await checkIfDirectoryContainsMusic(selectedPath)
      let dataAsString: string;

      if (msg[0] === false) {
        if (typeof msg[1] === "number") {
          dataAsString = msg[1].toString(); // Convert number to string
        } else {
          dataAsString = msg[1]; // It's already a string
        }
        setErrorDetails({
          title: "Invalid Directory!",
          data: dataAsString,
          type: 1
        })
        setError(true);
        setDirectory("");
      }

      if (selectedPath) {
        setDirectory(selectedPath);
        setError(false);
        setErrorDetails({
          title: "",
          data: "",
          type: 0
        })

        const totalSongs = msg[1]

        // Go to new EditPage
        // var msg = await invoke('read_music_directory', { directory: selectedPath })
        // console.log(msg)
        router.push(`/edit/editPage?directory=${selectedPath}&totalSongs=${totalSongs}&pageNo=${1}&pageSize=${10}`)
      } else return;

      

    } catch (error) {
      console.log(error);
    }
  }

  async function displaySessionsPage() {
    try {
      const selectedPath = open({
        title: "Select Music Library",
        directory: true,
        multiple: false,
        defaultPath: 'Downloads',
      });
      if (selectedPath) {
        setDirectory(selectedPath);
        setError(false);
        setErrorDetails({
          title: "",
          data: "",
          type: 0
        })
      } else return;

      // var msg: [2] = await checkIfDirectoryContainsMusic(selectedPath)

      // if (msg[0] === false) {
      //   setErrorDetails({
      //     title: "Invalid Directory!",
      //     data: "This directory cannot be selected as there are no Mp3 files present. Kindly choose the directory that has the files required to be scraped.",
      //     type: 1
      //   })
      //   setError(true);
      //   setDirectory("");
      //   return;
      // } else return;

    } catch (error) {
      console.log(error);
    }
  }

  async function checkIfDirectoryContainsMusic(selectedPath: any) {
    var msg: [boolean,number] | [boolean,string] = await invoke('check_directory', { var: selectedPath })
    return msg;
  }

  return (
    <div>
      <Heading
        title="Edit"
        description="Manually edit Music Metadata (In case our classifiers can&apos;t figure out your song)."
        icon={Pencil}
        iconColor="text-orange-700"
        otherProps="mb-4"
      // bgColor="bg-violet-500/10"
      />
      <div className="px-4 lg:px-8 flex justify-center items-center">
        <div className="rounded-lg 
                border 
                w-full 
                p-4 
                px-3 
                md:px-6 
                focus-within:shadow-sm
              ">
          <h5 className="text-l font-bold">Some Points to Note:</h5>
          <p className="text-sm py-4">
            <ol>
              <li>1. You can either update Music Metadata manually through the Edit option, or through our scraper.</li>
              <li>2. If you have already completed the scrape process, you can visit previous sessions to further edit your music metadata.</li>
              <li>3. To download indexed database, kindly turn on Developer Settings in <b>Settings</b>, as this is turned off by default.</li>
            </ol>

          </p>
          <div className="text-sm pb-2">Happy Editing!</div>

          <div className="grid
                grid-cols-12
                gap-2 py-2">
            <Button onClick={selectDirectory} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">Edit Songs</Button>
            <Button variant="outline2" onClick={() => router.push(`/start`)} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">Go To Scraper</Button>
            <Button onClick={displaySessionsPage} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">Edit Previous Sessions</Button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Edit;


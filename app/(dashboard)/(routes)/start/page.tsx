"use client";

import { Play } from "lucide-react";
import { open } from '@tauri-apps/api/dialog'

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { invoke } from '@tauri-apps/api/tauri'
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Dialog from "@/components/dialog";
import Alert from "@/components/alert";
import { listen, emit, type UnlistenFn } from "@tauri-apps/api/event";
import { z } from "zod";


const Start = () => {
  const [directory, setDirectory] = useState<any>();
  const [error, setError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<{ title: string, data: string }>({
    title: "",
    data: ""
  })

  const [progress, setProgress] = useState<number>(0);

  // let unListen: UnlistenFn;
  useEffect(() => {
    async function fetchProgressDetails() {
      let unListen: UnlistenFn = await listen('progress', (event) => {
        setProgress(z.number().parse(event.payload));
      });
      // console.log(progress);
    }
    fetchProgressDetails();
  }, [progress])

  function startSearch() {
    if (!directory) {
      setErrorDetails({
        title: "No Selected Directory",
        data: "Kindly select a directory that contains music files to be scraped."
      })
      setError(true);
      return;
    } else {
      setErrorDetails({
        title: "",
        data: ""
      })
      setError(false);
      invoke('set_db', { path_var: directory });
    };
  }

  async function checkIfDirectoryContainsMusic(selectedPath: any) {
    var msg = await invoke('check_directory', { var: selectedPath })
      .then((message) => {
        return message;
      })
      .catch((error) => console.error(error));
    console.log(msg);
    return msg;
  }

  async function selectDirectory() {
    try {
      const selectedPath = await open({
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
          data: ""
        })
      } else return;

      if (await checkIfDirectoryContainsMusic(selectedPath) === false) {
        setErrorDetails({
          title: "Invalid Directory!",
          data: "This directory cannot be selected as there are no Mp3 files present. Kindly choose the directory that has the files required to be scraped."
        })
        setError(true);
        setDirectory("");
        return;
      } else return;

    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div>
      <Heading
        title="Start Search"
        description="Our most advanced Vector based AI-indexing model for music metadata."
        icon={Play}
        iconColor="text-violet-500"
        otherProps="mb-8"
      // bgColor="bg-violet-500/10"
      />
      <div className="px-4 my-4 lg:px-8">

        {error === true ? (
          <>
            <Dialog msg={errorDetails.data} title={errorDetails.title} variant="destructive" type={true} />
            <Alert initial={error} msg={errorDetails.data} header={errorDetails.title} func={setError} />
          </>
        ) : (
          directory === "" || directory === undefined || directory === null ? null : <Dialog msg={directory} title="Selected Directory" variant="none" type={false} />
        )
        }
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
            <Button onClick={selectDirectory} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
              Select Directory
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
                  Settings
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Edit profile</SheetTitle>
                  <SheetDescription>
                    Make changes to your profile here. Click save when you&apos;re done.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" value="Pedro Duarte" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input id="username" value="@peduarte" className="col-span-3" />
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button type="submit">Save changes</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>



            <Button onClick={() => {
              setProgress(0);
              invoke('long_job');
            }} className="col-span-12 lg:col-span-3 w-full" type="submit" size="icon">
              Start
            </Button>
          </div>
          <Progress indicatorColor="bg-black" value={progress} className="w-1/2" />

        </div>
      </div>
    </div>
  );
}

export default Start;

